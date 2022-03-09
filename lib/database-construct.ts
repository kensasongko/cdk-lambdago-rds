import { Construct, IConstruct } from 'constructs';
import { Stack, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
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
  public readonly cluster: rds.ServerlessCluster;
  public readonly userSecret: rds.DatabaseSecret;

  constructor(scope: Stack, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const databaseName = this.node.tryGetContext('databaseName');

    const vpcId = ssm.StringParameter.valueFromLookup(this, '/Cdk/Core/VpcId');
    console.log(vpcId);
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcId: vpcId});
    //console.log(vpc);


    this.cluster = new rds.ServerlessCluster(this, 'RdsCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      defaultDatabaseName: databaseName,
      enableDataApi: true,
      credentials: rds.Credentials.fromGeneratedSecret('postgresAdmin', {
        secretName: 'rdsadmin',
      }),
      scaling: {
        // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.how-it-works.html#aurora-serverless.how-it-works.auto-scaling
        autoPause: props.rdsScalingAutoPauseMinutes,
        minCapacity: props.rdsScalingMinCapacity,
        maxCapacity: props.rdsScalingMaxCapacity,
      },
      backupRetention: props.rdsBackupRetentionDays,
      removalPolicy: props.removalPolicy,
    });

    this.userSecret = new rds.DatabaseSecret(this, 'postgresUser', {
      username: 'rdsuser',
      secretName: 'rdsuser',
      masterSecret: this.cluster.secret,
    });
    const rdsUserSecretAttached = this.userSecret.attach(this.cluster); // Adds DB connections information in the secret

    this.cluster.addRotationMultiUser('postgresUser', { // Add rotation using the multi user scheme
      secret: rdsUserSecretAttached,
      automaticallyAfter: props.rdsSecretRotationDays, // Change this?
    });

    new CfnOutput(this, 'RdsSecretArn', { value: this.userSecret.secretArn});
  }
}
