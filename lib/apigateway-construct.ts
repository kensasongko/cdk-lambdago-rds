import { Construct } from "constructs";
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from "@aws-cdk/aws-lambda-go-alpha";
import * as lambdan from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

interface ApigatewayStackProps extends StackProps {
  zone: route53.PublicHostedZone
  usersLambda: lambda.GoFunction;
}

export class ApigatewayStack extends Stack {

  constructor(scope: Construct, id: string, props: ApigatewayStackProps) {
    super(scope, id, props);

    const { env, zone, usersLambda } = props;

    const hostedZone = this.node.tryGetContext('hostedZone');
    const apigatewaySubdomain = this.node.tryGetContext('apigatewaySubdomain');
    const apigatewayDomain = apigatewaySubdomain + '.' + hostedZone;

    const certificate = new acm.DnsValidatedCertificate(this, 'ApigatewayCert', {
      domainName: apigatewayDomain,
      hostedZone: zone,
      region: env?.region,
    });

    const api = new apigateway.RestApi(this, "demo-api", {
      restApiName: 'Demo Service',
      domainName: {
        domainName: apigatewayDomain,
        certificate: certificate,
      },
    });

    const usersLambdaIntegration = new apigateway.LambdaIntegration(usersLambda);  
    api.root.addResource('users').addMethod('GET', usersLambdaIntegration);

    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      zone: zone,
      recordName: apigatewayDomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api))
    }); 
  }
}
