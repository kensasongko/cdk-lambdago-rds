#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { PersistentStack } from '../lib/persistent-stack';
import { ComputeStack } from '../lib/compute-stack';
//import { MonitoringStack } from "../lib/monitoring-stack";

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
const devEnv = env;
const prodEnv = env;

const app = new cdk.App();

const devPersistentStack = new PersistentStack(app, 'DevPersistentStack', {
  env: devEnv,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  rdsInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
  rdsBackupRetentionDays: cdk.Duration.days(0),
  rdsSecretRotationDays: cdk.Duration.days(1),
});

const devComputeStack = new ComputeStack(app, 'DevComputeStack', {
  env: devEnv,
  bastionInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MICRO),
  rdsUserSecret: devPersistentStack.database.userSecret,
  usersLambdaTimeout: cdk.Duration.seconds(30),
});
devComputeStack.addDependency(devPersistentStack);

/*
// Isi cloudwatch
new MonitoringStack(app, 'DevMonitoringStack', {
  env: devEnv,
});
*/

const prodPersistentStack = new PersistentStack(app, 'ProdPersistentStack', {
  env: prodEnv,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  rdsInstanceType: ec2.InstanceType.of(ec2.InstanceClass.MEMORY6_GRAVITON, ec2.InstanceSize.LARGE),
  rdsBackupRetentionDays: cdk.Duration.days(30),
  rdsSecretRotationDays: cdk.Duration.days(14),
});

const prodComputeStack = new ComputeStack(app, 'ProdComputeStack', {
  env: prodEnv,
  bastionInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MICRO),
  rdsUserSecret: prodPersistentStack.database.userSecret,
  usersLambdaTimeout: cdk.Duration.seconds(20),
});
prodComputeStack.addDependency(prodPersistentStack);

/*
new MonitoringStack(app, 'ProdMonitoringStack', {
  env: prodEnv,
});
*/
