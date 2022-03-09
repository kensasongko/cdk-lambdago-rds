import { App, Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';

import { UsersLambdaConstruct } from '../lib/users-lambda-construct';

interface ComputeStackProps extends StackProps {
  rdsCluster: rds.ServerlessCluster;
  rdsUserSecret: rds.DatabaseSecret;
}

export class ComputeStack extends Stack {
  constructor(scope: App, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const usersLambdaConstruct = new UsersLambdaConstruct(this, 'UsersLambdaConstruct', {
      rdsCluster: props.cluster,
      rdsUserSecret: props.userSecret,
    }); 
  }
}

