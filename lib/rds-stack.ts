import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';


interface RdsStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class RdsStack extends Stack {
  public readonly cluster: rds.ServerlessCluster;
  public readonly userSecret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const databaseName = this.node.tryGetContext('databaseName');

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
        autoPause: Duration.minutes(5),
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_8,
      },
      backupRetention: Duration.days(1), // Change this!
      removalPolicy: RemovalPolicy.DESTROY, // Change this!
    });

    this.userSecret = new rds.DatabaseSecret(this, 'postgresUser', {
      username: 'rdsuser',
      secretName: 'rdsuser',
      masterSecret: this.cluster.secret,
    });
    const rdsUserSecretAttached = this.userSecret.attach(this.cluster); // Adds DB connections information in the secret

    this.cluster.addRotationMultiUser('postgresUser', { // Add rotation using the multi user scheme
      secret: rdsUserSecretAttached,
      automaticallyAfter: Duration.days(1), // Change this?
    });

    new CfnOutput(this, 'RdsSecretArn', { value: this.userSecret.secretArn});
  }
}
