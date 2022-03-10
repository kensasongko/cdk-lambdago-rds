import { Construct, IConstruct } from 'constructs';
import { Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';


interface DatabaseConstructProps {
  removalPolicy: RemovalPolicy,
  rdsScalingAutoPauseMinutes: Duration,
  rdsScalingMinCapacity: rds.AuroraCapacityUnit,
  rdsScalingMaxCapacity: rds.AuroraCapacityUnit,
  rdsBackupRetentionDays: Duration,
  rdsSecretRotationDays: Duration,
}

export class DatabaseConstruct extends Construct {
  public readonly accessSg: ec2.SecurityGroup;
  public readonly userSecret: rds.DatabaseSecret;

  constructor(scope: Stack, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const databaseName = ssm.StringParameter.valueFromLookup(this, '/cdk/bootstrap/database-name');

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/cdk/core/vpc-id');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: vpcId});

    this.accessSg = new ec2.SecurityGroup(this, 'RdsAccessSG', {
      vpc: vpc,
    }); 

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSG', {
      vpc: vpc,
    }); 
    rdsSg.addIngressRule(this.accessSg, ec2.Port.tcp(5432), "Allow database access");

    const cluster = new rds.ServerlessCluster(this, 'RdsCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      clusterIdentifier: 'userslambda-rds',
      defaultDatabaseName: databaseName,
      enableDataApi: true,
      credentials: rds.Credentials.fromGeneratedSecret('postgresAdmin', {
        secretName: 'userslambda/rdsadmin',
      }),
      scaling: {
        // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.how-it-works.html#aurora-serverless.how-it-works.auto-scaling
        autoPause: props.rdsScalingAutoPauseMinutes,
        minCapacity: props.rdsScalingMinCapacity,
        maxCapacity: props.rdsScalingMaxCapacity,
      },
      securityGroups: [
        rdsSg
      ],
      backupRetention: props.rdsBackupRetentionDays,
      removalPolicy: props.removalPolicy,
    });

    this.userSecret = new rds.DatabaseSecret(this, 'postgresUser', {
      username: 'rdsuser',
      secretName: 'userslambda/rdsuser',
      masterSecret: cluster.secret,
    });
    const rdsUserSecretAttached = this.userSecret.attach(cluster); // Adds DB connections information in the secret

    cluster.addRotationMultiUser('postgresUser', { // Add rotation using the multi user scheme
      secret: rdsUserSecretAttached,
      automaticallyAfter: props.rdsSecretRotationDays, // Change this?
    });
  }
}
