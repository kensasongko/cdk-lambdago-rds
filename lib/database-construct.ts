import { Construct, IConstruct } from 'constructs';
import { Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';


interface DatabaseConstructProps {
  removalPolicy: RemovalPolicy,
  rdsInstanceType: ec2.InstanceType,
  rdsBackupRetentionDays: Duration,
  rdsSecretRotationDays: Duration,
}

export class DatabaseConstruct extends Construct {
  public readonly userSecret: rds.DatabaseSecret;

  constructor(scope: Stack, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const databaseName = ssm.StringParameter.valueFromLookup(this, '/cdk/bootstrap/database-name');

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/cdk/core/vpc-id');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: vpcId});

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSG', {
      vpc: vpc,
    }); 

    rdsSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), "Allow database access");

    const engine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_14_1 });
    const instance = new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: engine,
      instanceType: props.rdsInstanceType,
      multiAz: true,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceIdentifier: 'userslambda-rds',
      databaseName: databaseName,
      credentials: rds.Credentials.fromGeneratedSecret('postgresAdmin', {
        secretName: 'userslambda/rdsadmin',
      }),
      securityGroups: [
        rdsSg
      ],
      backupRetention: props.rdsBackupRetentionDays,
      removalPolicy: props.removalPolicy,
    });

    this.userSecret = new rds.DatabaseSecret(this, 'postgresUser', {
      username: 'rdsuser',
      secretName: 'userslambda/rdsuser',
      masterSecret: instance.secret,
    });
    const rdsUserSecretAttached = this.userSecret.attach(instance); // Adds DB connections information in the secret

    instance.addRotationMultiUser('postgresUser', { // Add rotation using the multi user scheme
      secret: rdsUserSecretAttached,
      automaticallyAfter: props.rdsSecretRotationDays,
    });
  }
}
