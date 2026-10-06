package com.mypocket.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityLoginBinding;
import com.mypocket.app.models.AuthResponse;
import com.mypocket.app.models.User;
import com.mypocket.app.repository.AuthRepository;
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

        binding.btnLogin.setOnClickListener(v -> performLogin());

        binding.btnGoToRegister.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });

        binding.btnForgotPassword.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, ForgotPasswordActivity.class));
        });
    }

    private void performLogin() {
        String mobile = binding.etMobile.getText() != null ? binding.etMobile.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? binding.etPassword.getText().toString().trim() : "";

        if (mobile.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter mobile number and password", Toast.LENGTH_SHORT).show();
            return;
        }

        binding.btnLogin.setEnabled(false);
        authRepository.login(mobile, password, new Callback<AuthResponse>() {
            @Override
            public void onResponse(@NonNull Call<AuthResponse> call, @NonNull Response<AuthResponse> response) {
                binding.btnLogin.setEnabled(true);
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
                    Toast.makeText(LoginActivity.this, "Invalid mobile number or password", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<AuthResponse> call, @NonNull Throwable t) {
                binding.btnLogin.setEnabled(true);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
