package com.mypocket.app.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.mypocket.app.activities.LoginActivity;
import com.mypocket.app.databinding.FragmentProfileBinding;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.utils.PreferenceManager;

public class ProfileFragment extends Fragment {

    private FragmentProfileBinding binding;
    private PreferenceManager preferenceManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        preferenceManager = new PreferenceManager(requireContext());

        binding.tvName.setText(preferenceManager.getUserName());
        binding.tvMobile.setText(preferenceManager.getUserMobile());
        binding.etBaseUrl.setText(preferenceManager.getBaseUrl());

        binding.btnSaveUrl.setOnClickListener(v -> {
            String url = binding.etBaseUrl.getText().toString().trim();
            if (!url.isEmpty()) {
                preferenceManager.saveBaseUrl(url);
                ApiClient.resetClient();
                Toast.makeText(requireContext(), "API Base URL updated!", Toast.LENGTH_SHORT).show();
            }
        });

        binding.btnLogout.setOnClickListener(v -> {
            preferenceManager.clear();
            ApiClient.resetClient();
            Intent intent = new Intent(requireContext(), LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
