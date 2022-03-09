#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';

import { PersistenceStack } from '../lib/persistence-stack';
//import { ComputeStack } from '../lib/compute-stack';
//import { MonitoringStack } from "../lib/monitoring-stack";

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const app = new cdk.App();

const config = app.node.tryGetContext('config');
const envConfig = app.node.tryGetContext(config);
const deployConfig = {
  removalPolicy: cdk.RemovalPolicy[(envConfig['removalPolicy']) as keyof typeof cdk.RemovalPolicy],
  rdsScalingAutoPauseMinutes: cdk.Duration.minutes(envConfig['rdsScalingAutoPauseMinutes']),
  rdsScalingMinCapacity: rds.AuroraCapacityUnit[(envConfig['rdsScalingMinCapacity']) as keyof typeof rds.AuroraCapacityUnit],
  rdsScalingMaxCapacity: rds.AuroraCapacityUnit[(envConfig['rdsScalingMaxCapacity']) as keyof typeof rds.AuroraCapacityUnit],
  rdsBackupRetentionDays: cdk.Duration.days(envConfig['rdsBackupRetentionDays']),
  rdsSecretRotationDays: cdk.Duration.days(envConfig['rdsSecretRotationDays']),
}
console.log(deployConfig);

const persistenceStack = new PersistenceStack(app, 'PersistenceStack', {
  env: env,
  removalPolicy: deployConfig.removalPolicy,
  rdsScalingAutoPauseMinutes: deployConfig.rdsScalingAutoPauseMinutes,
  rdsScalingMinCapacity: deployConfig.rdsScalingMinCapacity,
  rdsScalingMaxCapacity: deployConfig.rdsScalingMaxCapacity,
  rdsBackupRetentionDays: deployConfig.rdsBackupRetentionDays,
  rdsSecretRotationDays: deployConfig.rdsSecretRotationDays,
});

/*
new computeStack(app, 'ComputeStack', {
  env: env,
  rdsCluster: persistenceStack.databaseConstruct.cluster,
  rdsUserSecret: persistenceStack.databaseConstruct.userSecret,
});
computeStack.addDependency(persistenceStack);

new MonitoringStack(app, 'MonitoringStack', {
});

const apigatewayStack = new ApigatewayStack(app, 'ApigatewayStack', {
  env: env,
  zone: domainStack.zone,
  usersLambda: usersLambdaStack.handler,
});
apigatewayStack.addDependency(domainStack);
apigatewayStack.addDependency(usersLambdaStack);
*/
