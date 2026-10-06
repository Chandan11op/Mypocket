package com.mypocket.app.activities;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityRegisterBinding;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.RegisterRequest;
import com.mypocket.app.repository.AuthRepository;

import java.util.Calendar;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private ActivityRegisterBinding binding;
    private AuthRepository authRepository;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRegisterBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        authRepository = new AuthRepository(this);

        binding.etDob.setOnClickListener(v -> showDatePicker());

        binding.btnRegister.setOnClickListener(v -> performRegistration());

        binding.btnGoToLogin.setOnClickListener(v -> finish());
    }

    private void showDatePicker() {
        final Calendar c = Calendar.getInstance();
        int year = c.get(Calendar.YEAR) - 20;
        int month = c.get(Calendar.MONTH);
        int day = c.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog dialog = new DatePickerDialog(this, (view, y, m, d) -> {
            String selectedDate = String.format(Locale.US, "%04d-%02d-%02d", y, m + 1, d);
            binding.etDob.setText(selectedDate);
        }, year, month, day);
        dialog.show();
    }

    private void performRegistration() {
        String mobile = binding.etMobile.getText() != null ? binding.etMobile.getText().toString().trim() : "";
        String fullName = binding.etFullName.getText() != null ? binding.etFullName.getText().toString().trim() : "";
        String username = binding.etUsername.getText() != null ? binding.etUsername.getText().toString().trim() : "";
        String email = binding.etEmail.getText() != null ? binding.etEmail.getText().toString().trim() : "";
        String dob = binding.etDob.getText() != null ? binding.etDob.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? binding.etPassword.getText().toString().trim() : "";

        if (mobile.isEmpty() || fullName.isEmpty() || username.isEmpty() || email.isEmpty() || dob.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "All fields are required", Toast.LENGTH_SHORT).show();
            return;
        }

        RegisterRequest req = new RegisterRequest(mobile, username, email, fullName, dob, password);

        binding.btnRegister.setEnabled(false);
        authRepository.register(req, new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                binding.btnRegister.setEnabled(true);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(RegisterActivity.this, "Registration successful! Please login.", Toast.LENGTH_LONG).show();
                    finish();
                } else {
                    String msg = "Registration failed";
                    if (response.body() != null && response.body().getMessage() != null) {
                        msg = response.body().getMessage();
                    }
                    Toast.makeText(RegisterActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                binding.btnRegister.setEnabled(true);
                Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
