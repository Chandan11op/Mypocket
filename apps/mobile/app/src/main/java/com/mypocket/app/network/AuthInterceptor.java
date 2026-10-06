package com.mypocket.app.network;

import androidx.annotation.NonNull;

import com.mypocket.app.utils.PreferenceManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class AuthInterceptor implements Interceptor {
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

        return chain.proceed(builder.build());
    }
}
