package com.mypocket.app.network;

import android.util.Log;

import androidx.annotation.NonNull;

import com.google.gson.Gson;
import com.mypocket.app.models.RefreshRequest;
import com.mypocket.app.models.RefreshResponse;
import com.mypocket.app.utils.PreferenceManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AuthInterceptor implements Interceptor {
    private static final String TAG = "AuthInterceptor";
    private final PreferenceManager preferenceManager;

    public AuthInterceptor(PreferenceManager preferenceManager) {
        this.preferenceManager = preferenceManager;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request originalRequest = chain.request();
        Request.Builder builder = originalRequest.newBuilder()
                .header("x-client-type", "android")
                .header("x-device-name", "Android Mobile");

        String token = preferenceManager.getAccessToken();
        if (token != null && !token.isEmpty()) {
            builder.header("Authorization", "Bearer " + token);
        }

        Response response = chain.proceed(builder.build());

        // Transparent Token Refresh on 401 Unauthorized
        if (response.code() == 401 && !originalRequest.url().encodedPath().contains("/auth/login") && !originalRequest.url().encodedPath().contains("/auth/refresh")) {
            synchronized (this) {
                String refreshToken = preferenceManager.getRefreshToken();
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    Log.d(TAG, "Access token expired (401). Attempting silent token refresh...");
                    String newAccessToken = performTokenRefresh(refreshToken);
                    if (newAccessToken != null && !newAccessToken.isEmpty()) {
                        response.close(); // Close previous failed response
                        Request newRequest = originalRequest.newBuilder()
                                .header("x-client-type", "android")
                                .header("x-device-name", "Android Mobile")
                                .header("Authorization", "Bearer " + newAccessToken)
                                .build();
                        return chain.proceed(newRequest);
                    } else {
                        Log.e(TAG, "Token refresh failed. Session cleared.");
                        preferenceManager.clear();
                    }
                }
            }
        }

        return response;
    }

    private String performTokenRefresh(String refreshToken) {
        try {
            OkHttpClient client = new OkHttpClient();
            MediaType mediaType = MediaType.parse("application/json; charset=utf-8");
            String jsonBody = new Gson().toJson(new RefreshRequest(refreshToken));
            RequestBody body = RequestBody.create(jsonBody, mediaType);

            String refreshUrl = preferenceManager.getBaseUrl() + "auth/refresh";
            Request request = new Request.Builder()
                    .url(refreshUrl)
                    .post(body)
                    .build();

            try (Response refreshResponse = client.newCall(request).execute()) {
                if (refreshResponse.isSuccessful() && refreshResponse.body() != null) {
                    String json = refreshResponse.body().string();
                    RefreshResponse res = new Gson().fromJson(json, RefreshResponse.class);
                    if (res != null && res.isSuccess() && res.getData() != null) {
                        String newAccess = res.getData().getAccessToken();
                        String newRefresh = res.getData().getRefreshToken();

                        preferenceManager.saveSession(
                                newAccess,
                                newRefresh != null ? newRefresh : refreshToken,
                                preferenceManager.getAccessToken(), // keep user info
                                preferenceManager.getUserName(),
                                "",
                                preferenceManager.getUserMobile()
                        );
                        Log.d(TAG, "Token refreshed successfully!");
                        return newAccess;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during token refresh", e);
        }
        return null;
    }
}
