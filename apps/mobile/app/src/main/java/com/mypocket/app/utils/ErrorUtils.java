package com.mypocket.app.utils;

import android.util.Log;

import com.google.gson.Gson;
import com.mypocket.app.models.GenericResponse;

import java.io.IOException;

import retrofit2.Response;

public class ErrorUtils {
    private static final String TAG = "MyPocketAuth";

    public static String parseError(Response<?> response) {
        if (response == null) {
            return "Unable to connect to My Pocket. Please check your internet connection.";
        }

        int code = response.code();
        Log.d(TAG, "HTTP Error Code: " + code);

        String messageFromServer = null;
        if (response.errorBody() != null) {
            try {
                String errorJson = response.errorBody().string();
                Log.d(TAG, "Error body: " + errorJson);
                GenericResponse genericResponse = new Gson().fromJson(errorJson, GenericResponse.class);
                if (genericResponse != null && genericResponse.getMessage() != null) {
                    messageFromServer = genericResponse.getMessage();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error parsing error body", e);
            }
        }

        switch (code) {
            case 401:
                return messageFromServer != null ? messageFromServer : "Mobile number or password is incorrect.";
            case 400:
                return messageFromServer != null ? messageFromServer : "Please check the information you entered.";
            case 409:
                return messageFromServer != null ? messageFromServer : "An account with this information already exists.";
            case 403:
                return "Access denied.";
            case 404:
                return "Service endpoint not found.";
            case 408:
                return "Server is taking too long to respond. Please try again.";
            case 500:
            case 502:
            case 503:
                return "My Pocket server is temporarily unavailable.";
            default:
                return messageFromServer != null ? messageFromServer : "Something went wrong (Error " + code + "). Please try again.";
        }
    }

    public static String parseFailure(Throwable t) {
        Log.e(TAG, "Network Failure: " + t.getMessage(), t);
        if (t instanceof IOException) {
            return "Unable to connect to My Pocket. Check your internet connection or server URL.";
        }
        return "Server is taking too long to respond. Please try again.";
    }
}
