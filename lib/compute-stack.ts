import { App, Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { BastionConstruct } from '../lib/bastion-construct';
import { UsersLambdaConstruct } from '../lib/users-lambda-construct';
import { ApigatewayConstruct } from '../lib/apigateway-construct';

interface ComputeStackProps extends StackProps {
  bastionInstanceType: ec2.InstanceType;
  usersLambdaTimeout: Duration;
  rdsUserSecret: rds.DatabaseSecret;
}

export class ComputeStack extends Stack {
  constructor(scope: App, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const bastionConstruct = new BastionConstruct(this, 'BastionConstruct', {
      instanceType: props.bastionInstanceType,
      rdsUserSecret: props.rdsUserSecret,
    });

    const usersLambdaConstruct = new UsersLambdaConstruct(this, 'UsersLambdaConstruct', {
      lambdaTimeout: props.usersLambdaTimeout,
      rdsUserSecret: props.rdsUserSecret,
    }); 

    const apigatewayConctruct = new ApigatewayConstruct(this, 'ApigatewayConstruct', {
      usersLambda: usersLambdaConstruct.handler,
    });
  }
}

