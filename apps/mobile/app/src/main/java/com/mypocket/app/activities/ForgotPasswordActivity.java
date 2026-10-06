package com.mypocket.app.activities;

import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityForgotPasswordBinding;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.repository.AuthRepository;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordActivity extends AppCompatActivity {

    private ActivityForgotPasswordBinding binding;
    private AuthRepository authRepository;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityForgotPasswordBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        authRepository = new AuthRepository(this);

        binding.btnSendToken.setOnClickListener(v -> sendToken());
        binding.btnResetPassword.setOnClickListener(v -> resetPassword());
    }

    private void sendToken() {
        String identifier = binding.etIdentifier.getText() != null ? binding.etIdentifier.getText().toString().trim() : "";
        if (identifier.isEmpty()) {
            Toast.makeText(this, "Enter email or mobile", Toast.LENGTH_SHORT).show();
            return;
        }

        authRepository.forgotPassword(identifier, new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                Toast.makeText(ForgotPasswordActivity.this, "Reset request processed", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                Toast.makeText(ForgotPasswordActivity.this, "Error sending request", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void resetPassword() {
        String token = binding.etResetToken.getText() != null ? binding.etResetToken.getText().toString().trim() : "";
        String newPass = binding.etNewPassword.getText() != null ? binding.etNewPassword.getText().toString().trim() : "";

        if (token.isEmpty() || newPass.isEmpty()) {
            Toast.makeText(this, "Enter token and new password", Toast.LENGTH_SHORT).show();
            return;
        }

        authRepository.resetPassword(token, newPass, new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(ForgotPasswordActivity.this, "Password reset successfully! Log in now.", Toast.LENGTH_LONG).show();
                    finish();
                } else {
                    Toast.makeText(ForgotPasswordActivity.this, "Failed to reset password", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                Toast.makeText(ForgotPasswordActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
