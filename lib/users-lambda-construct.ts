import * as path from 'path';

import { Construct } from "constructs";
import { Stack, StackProps, DockerImage, Duration } from 'aws-cdk-lib';
import * as lambdago from "@aws-cdk/aws-lambda-go-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from 'aws-cdk-lib/aws-rds';

interface UsersLambdaStackProps extends StackProps {
  rdsCluster: rds.ServerlessCluster;
  rdsUserSecret: rds.DatabaseSecret;
}

export class UsersLambdaStack extends Stack {
  public readonly handler: lambdago.GoFunction;

  constructor(scope: Construct, id: string, props: UsersLambdaStackProps) {
    super(scope, id, props);

    const { env, rdsCluster, rdsUserSecret } = props;

    const databaseName = this.node.tryGetContext('databaseName');

    const lambdaPath = path.join(__dirname, '../sources/users/src');
    this.handler = new lambdago.GoFunction(this, 'UsersHandler', {
      //runtime: lambdago.Runtime.GO_1_X,
      entry: lambdaPath,
      functionName: 'UsersHandler',
      // Enable X-Ray tracing.
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(30),
      environment: {
        "RDS_SECRET_ARN": rdsUserSecret.secretArn,
        "RDS_DBNAME": databaseName,
        "RDS_ARN": rdsCluster.clusterArn,
      }
    });

    rdsUserSecret.grantRead(this.handler);
    rdsCluster.grantDataApiAccess(this.handler);
  }
}
