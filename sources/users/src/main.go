package main

import (
	"context"
	"fmt"
  "encoding/json"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
  "github.com/aws/aws-sdk-go/service/rdsdataservice"
	"os"
)

type User struct {
  Id int64
  Name string
}

type Users []User

func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
  // Create new session
  sess, _ := session.NewSession(&aws.Config{
      //Region: aws.String(},
      Region: aws.String(os.Getenv("AWS_REGION")),
    })


  // Should use parameterized query.
  query := "SELECT id, name FROM users";

  // Create RDS client
  client := rdsdataservice.New(sess)

  // Execute Statement
  req, resp := client.ExecuteStatementRequest(&rdsdataservice.ExecuteStatementInput{
      Database:    aws.String(os.Getenv("RDS_DBNAME")),
	    ResourceArn: aws.String(os.Getenv("RDS_ARN")),
	    SecretArn:   aws.String(os.Getenv("RDS_SECRET_ARN")),
      Sql:         aws.String(query),
  })

  err := req.Send()

  if err != nil {
    return events.APIGatewayProxyResponse{
      StatusCode: 200,
      Body:       fmt.Sprintf("{\"ErrPing\": \"%s\"}", err),
    }, nil
  }

  var users Users
  for _, record := range resp.Records {
    users = append(users, User {
      Id: *record[0].LongValue,
      Name: *record[1].StringValue,
    })
  }
  body, _ := json.Marshal(users)

  return events.APIGatewayProxyResponse{
    StatusCode: 200,
    Body:       string(body),
  }, nil
}

func main() {
	lambda.Start(HandleRequest)
}
