package com.mypocket.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityOnboardingBinding;
import com.mypocket.app.models.CreateAccountRequest;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.PreferenceManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OnboardingActivity extends AppCompatActivity {

    private ActivityOnboardingBinding binding;
    private AccountRepository accountRepository;
    private PreferenceManager preferenceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityOnboardingBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        accountRepository = new AccountRepository(this);
        preferenceManager = new PreferenceManager(this);

        binding.btnCompleteOnboarding.setOnClickListener(v -> saveAccountsAndFinish());
    }

    private void saveAccountsAndFinish() {
        double cash = parseDouble(binding.etCash.getText() != null ? binding.etCash.getText().toString() : "0");
        double bank = parseDouble(binding.etBank.getText() != null ? binding.etBank.getText().toString() : "0");
        double wallet = parseDouble(binding.etWallet.getText() != null ? binding.etWallet.getText().toString() : "0");
        double investment = parseDouble(binding.etInvestment.getText() != null ? binding.etInvestment.getText().toString() : "0");
        double liability = parseDouble(binding.etLiability.getText() != null ? binding.etLiability.getText().toString() : "0");

        binding.btnCompleteOnboarding.setEnabled(false);

        createAccountIfPositive("Cash", "ASSET", "CASH", "Cash in Hand", cash);
        createAccountIfPositive("BOB Savings", "ASSET", "BANK", "Bank of Baroda", bank);
        createAccountIfPositive("Slice Wallet", "ASSET", "WALLET", "Slice", wallet);
        createAccountIfPositive("Groww Investments", "ASSET", "INVESTMENT", "Groww", investment);
        createAccountIfPositive("Credit Card Loan", "LIABILITY", "CREDIT_CARD", "Credit Card", liability);

        preferenceManager.setOnboarded(true);
        Toast.makeText(this, "Financial onboarding completed!", Toast.LENGTH_SHORT).show();

        startActivity(new Intent(OnboardingActivity.this, MainActivity.class));
        finish();
    }

    private void createAccountIfPositive(String name, String aClass, String aType, String inst, double amount) {
        if (amount > 0) {
            accountRepository.createAccount(new CreateAccountRequest(name, aClass, aType, inst, amount), new Callback<GenericResponse>() {
                @Override
                public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {}

                @Override
                public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {}
            });
        }
    }

    private double parseDouble(String str) {
        try {
            return Double.parseDouble(str.trim());
        } catch (Exception e) {
            return 0;
        }
    }
}
