package com.mypocket.app.activities;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivitySettingsBinding;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.utils.PreferenceManager;

public class SettingsActivity extends AppCompatActivity {

    private ActivitySettingsBinding binding;
    private PreferenceManager preferenceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySettingsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        preferenceManager = new PreferenceManager(this);

        binding.btnBack.setOnClickListener(v -> finish());
        binding.etBaseUrl.setText(preferenceManager.getBaseUrl());

        binding.btnSaveUrl.setOnClickListener(v -> {
            String url = binding.etBaseUrl.getText() != null ? binding.etBaseUrl.getText().toString().trim() : "";
            if (!url.isEmpty()) {
                preferenceManager.saveBaseUrl(url);
                ApiClient.resetClient();
                Toast.makeText(this, "Production Base URL updated!", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
