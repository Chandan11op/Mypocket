package com.mypocket.app.activities;

import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityAddAccountBinding;
import com.mypocket.app.models.CreateAccountRequest;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.repository.AccountRepository;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddAccountActivity extends AppCompatActivity {

    private ActivityAddAccountBinding binding;
    private AccountRepository accountRepository;

    private final String[] classes = {"ASSET", "LIABILITY", "INCOME", "EXPENSE"};
    private final String[] types = {"BANK", "CASH", "WALLET", "INVESTMENT", "CREDIT_CARD", "LOAN", "RECEIVABLE"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAddAccountBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        accountRepository = new AccountRepository(this);

        ArrayAdapter<String> classAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, classes);
        classAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spAccountClass.setAdapter(classAdapter);

        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, types);
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spAccountType.setAdapter(typeAdapter);

        binding.btnSaveAccount.setOnClickListener(v -> saveAccount());
    }

    private void saveAccount() {
        String name = binding.etAccountName.getText() != null ? binding.etAccountName.getText().toString().trim() : "";
        if (name.isEmpty()) {
            Toast.makeText(this, "Please enter account name", Toast.LENGTH_SHORT).show();
            return;
        }

        String aClass = classes[binding.spAccountClass.getSelectedItemPosition()];
        String aType = types[binding.spAccountType.getSelectedItemPosition()];
        String inst = binding.etInstitution.getText() != null ? binding.etInstitution.getText().toString().trim() : "";
        String balStr = binding.etOpeningBalance.getText() != null ? binding.etOpeningBalance.getText().toString().trim() : "0";

        double openingBalance = 0;
        try {
            openingBalance = Double.parseDouble(balStr);
        } catch (Exception ignored) {}

        binding.btnSaveAccount.setEnabled(false);
        CreateAccountRequest req = new CreateAccountRequest(name, aClass, aType, inst, openingBalance);

        accountRepository.createAccount(req, new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                binding.btnSaveAccount.setEnabled(true);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(AddAccountActivity.this, "Account created!", Toast.LENGTH_SHORT).show();
                    finish();
                } else {
                    Toast.makeText(AddAccountActivity.this, "Failed to create account", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                binding.btnSaveAccount.setEnabled(true);
                Toast.makeText(AddAccountActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
