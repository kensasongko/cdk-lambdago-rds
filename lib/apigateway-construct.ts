import { Construct } from "constructs";
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from "@aws-cdk/aws-lambda-go-alpha";
import * as lambdan from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';

interface ApigatewayConstructProps {
  usersLambda: lambda.GoFunction;
}

export class ApigatewayConstruct extends Construct {
  constructor(scope: Stack, id: string, props: ApigatewayConstructProps) {
    super(scope, id);

    const domain = ssm.StringParameter.valueFromLookup(this, '/cdk/bootstrap/domain');
    const apigatewaySubdomain = ssm.StringParameter.valueFromLookup(this, '/cdk/bootstrap/apigateway-subdomain');
    const certificateArn = ssm.StringParameter.valueFromLookup(this, '/cdk/core/wildcard-certificate-arn');

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: domain,
    });

    const apigatewayDomain = apigatewaySubdomain + '.' + domain;
    const certificate = acm.Certificate.fromCertificateArn(this, 'DomainCert', certificateArn);

    const api = new apigateway.RestApi(this, "LambdagoApigateway", {
      restApiName: 'lambdago-apigateway',
      domainName: {
        domainName: apigatewayDomain,
        certificate: certificate,
      },
    });

    const usersLambdaIntegration = new apigateway.LambdaIntegration(props.usersLambda);  
    api.root.addResource('users').addMethod('GET', usersLambdaIntegration);

    new route53.ARecord(this, 'ApigatewayAlias', {
      zone: zone,
      recordName: apigatewayDomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api))
    }); 
  }
}
