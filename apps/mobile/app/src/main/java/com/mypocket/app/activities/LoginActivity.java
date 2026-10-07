package com.mypocket.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityLoginBinding;
import com.mypocket.app.models.AuthResponse;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.User;
import com.mypocket.app.repository.AuthRepository;
import com.mypocket.app.utils.ErrorUtils;
import com.mypocket.app.utils.PreferenceManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private ActivityLoginBinding binding;
    private AuthRepository authRepository;
    private PreferenceManager preferenceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        authRepository = new AuthRepository(this);
        preferenceManager = new PreferenceManager(this);

        checkServerHealth();

        binding.btnLogin.setOnClickListener(v -> performLogin());

        binding.btnGoToRegister.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });

        binding.btnForgotPassword.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, ForgotPasswordActivity.class));
        });
    }

    private void checkServerHealth() {
        authRepository.checkHealth(new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                if (!response.isSuccessful()) {
                    showError("Warning: Server returned status " + response.code());
                }
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                showError("Unable to connect to My Pocket backend. Please check network / server URL.");
            }
        });
    }

    private void performLogin() {
        hideError();

        String mobile = binding.etMobile.getText() != null ? binding.etMobile.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? binding.etPassword.getText().toString().trim() : "";

        if (mobile.isEmpty() || password.isEmpty()) {
            showError("Please enter mobile number and password");
            return;
        }

        setLoading(true);

        authRepository.login(mobile, password, new Callback<AuthResponse>() {
            @Override
            public void onResponse(@NonNull Call<AuthResponse> call, @NonNull Response<AuthResponse> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    AuthResponse.AuthData data = response.body().getData();
                    if (data != null) {
                        User u = data.getUser();
                        String name = u != null ? u.getFullName() : "User";
                        String email = u != null ? u.getEmail() : "";
                        String userId = u != null ? u.getId() : "";

                        preferenceManager.saveSession(
                                data.getAccessToken(),
                                data.getRefreshToken(),
                                userId,
                                name,
                                email,
                                mobile
                        );

                        Toast.makeText(LoginActivity.this, "Welcome to My Pocket!", Toast.LENGTH_SHORT).show();

                        Intent intent;
                        if (preferenceManager.isOnboarded()) {
                            intent = new Intent(LoginActivity.this, MainActivity.class);
                        } else {
                            intent = new Intent(LoginActivity.this, OnboardingActivity.class);
                        }
                        startActivity(intent);
                        finish();
                    }
                } else {
                    String errorMsg = ErrorUtils.parseError(response);
                    showError(errorMsg);
                }
            }

            @Override
            public void onFailure(@NonNull Call<AuthResponse> call, @NonNull Throwable t) {
                setLoading(false);
                String errorMsg = ErrorUtils.parseFailure(t);
                showError(errorMsg);
            }
        });
    }

    private void setLoading(boolean isLoading) {
        binding.btnLogin.setEnabled(!isLoading);
        binding.btnLogin.setText(isLoading ? "Signing in..." : "LOG IN");
        binding.progressLogin.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showError(String msg) {
        binding.tvError.setText(msg);
        binding.tvError.setVisibility(View.VISIBLE);
    }

    private void hideError() {
        binding.tvError.setText("");
        binding.tvError.setVisibility(View.GONE);
    }
}
