package com.seenema.backend.GetUserInfo.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2HTTPEvent;
import com.google.gson.Gson;
import com.seenema.backend.GetUserInfo.model.RequestBody;
import com.seenema.backend.GetUserInfo.model.Response;
import com.seenema.backend.utils.Constants;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GetUserInfoHandler implements RequestHandler<APIGatewayV2HTTPEvent, String> {

    Gson           gson           = new Gson();
    DynamoDbClient dynamoDbClient = DynamoDbClient.builder().build();

    @Override
    public String handleRequest(APIGatewayV2HTTPEvent input, Context context) {
        try {
            // Assuming you've defined RequestBody and Response classes
            RequestBody requestBody = gson.fromJson(input.getBody(), RequestBody.class);
            String userEmail = requestBody.getEmail();
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("Email", AttributeValue.builder().s(userEmail).build());

            GetItemRequest getItemRequest = GetItemRequest.builder()
                    .tableName(Constants.DYNAMODB_TABLE)
                    .key(key)
                    .build();

            GetItemResponse response = dynamoDbClient.getItem(getItemRequest);

            if (response.hasItem()) {
                Map<String, AttributeValue> item = response.item();
                //TODO: Handle edge cases where Email, LastName and/or FirstName is not present
                String Email = item.get("Email").s();
                String LastName = item.get("LastName").s();
                String FirstName = item.get("FirstName").s();
                //TODO: Write tests for this when user doesn't have any friends or movies added
                List<String> Friends = item.getOrDefault("Friends", AttributeValue.builder().ss().build()).ss();
                List<String> Movies = item.getOrDefault("Movies", AttributeValue.builder().ss().build()).ss();
                List<String> MovieSuggestionsList = item.getOrDefault("MovieSuggestionsList", AttributeValue.builder().ss().build()).ss();

                // Assuming you have a constructor in the Response class
                return gson.toJson(new Response(Email, LastName, FirstName, Friends, Movies, MovieSuggestionsList));
            } else {
                return gson.toJson(new Response("User not found"));
            }

        } catch (DynamoDbException e) {
            context.getLogger().log("Error: " + e.getMessage());
            // Assuming you have an error constructor in the Response class
            return gson.toJson(new Response("Error retrieving user information"));
        }
    }
}
