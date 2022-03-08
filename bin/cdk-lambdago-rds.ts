#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { DomainStack } from '../lib/domain-stack';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from "../lib/rds-stack";
import { UsersLambdaStack } from "../lib/users-lambda-stack";
import { ApigatewayStack } from "../lib/apigateway-stack";

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const app = new cdk.App();

const domainStack = new DomainStack(app, 'DomainStack', {env: env});

const vpcStack = new VpcStack(app, 'VpcStack', {env: env});

const rdsStack = new RdsStack(app, 'RdsStack', {
  vpc: vpcStack.vpc,
  env: env
});
rdsStack.addDependency(vpcStack);

const usersLambdaStack = new UsersLambdaStack(app, 'UsersLambdaStack', { 
  rdsCluster: rdsStack.cluster,
  rdsUserSecret: rdsStack.userSecret,
  env: env, 
});
usersLambdaStack.addDependency(rdsStack);

const apigatewayStack = new ApigatewayStack(app, 'ApigatewayStack', {
  env: env,
  zone: domainStack.zone,
  usersLambda: usersLambdaStack.handler,
});
apigatewayStack.addDependency(domainStack);
apigatewayStack.addDependency(usersLambdaStack);
