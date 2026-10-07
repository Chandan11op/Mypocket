package com.mypocket.app.repository;

import android.content.Context;

import com.mypocket.app.models.AuthResponse;
import com.mypocket.app.models.ForgotPasswordRequest;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.LoginRequest;
import com.mypocket.app.models.RegisterRequest;
import com.mypocket.app.models.ResetPasswordRequest;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.network.ApiService;

import retrofit2.Call;
import retrofit2.Callback;

public class AuthRepository {
    private final ApiService apiService;

    public AuthRepository(Context context) {
        this.apiService = ApiClient.getService(context);
    }

    public void checkHealth(Callback<GenericResponse> callback) {
        apiService.checkHealth().enqueue(callback);
    }

    public void login(String mobile, String password, Callback<AuthResponse> callback) {
        apiService.login(new LoginRequest(mobile, password)).enqueue(callback);
    }

    public void register(RegisterRequest request, Callback<GenericResponse> callback) {
        apiService.register(request).enqueue(callback);
    }

    public void forgotPassword(String identifier, Callback<GenericResponse> callback) {
        apiService.forgotPassword(new ForgotPasswordRequest(identifier)).enqueue(callback);
    }

    public void resetPassword(String token, String newPassword, Callback<GenericResponse> callback) {
        apiService.resetPassword(new ResetPasswordRequest(token, newPassword)).enqueue(callback);
    }

    public void getMe(Callback<AuthResponse> callback) {
        apiService.getMe().enqueue(callback);
    }

    public void logout(Callback<GenericResponse> callback) {
        apiService.logout().enqueue(callback);
    }
}
