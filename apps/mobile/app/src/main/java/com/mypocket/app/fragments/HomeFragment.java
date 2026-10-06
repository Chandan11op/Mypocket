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
import androidx.recyclerview.widget.LinearLayoutManager;

import com.mypocket.app.activities.AddTransactionActivity;
import com.mypocket.app.adapters.TransactionAdapter;
import com.mypocket.app.databinding.FragmentHomeBinding;
import com.mypocket.app.models.FinancialPositionResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.FormatUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private AccountRepository accountRepository;
    private TransactionAdapter transactionAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        accountRepository = new AccountRepository(requireContext());
        transactionAdapter = new TransactionAdapter();

        binding.rvRecentTransactions.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvRecentTransactions.setAdapter(transactionAdapter);

        binding.btnAddTransaction.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), AddTransactionActivity.class));
        });

        binding.swipeRefresh.setOnRefreshListener(this::loadData);

        loadData();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadData();
    }

    private void loadData() {
        binding.swipeRefresh.setRefreshing(true);
        accountRepository.getFinancialPosition(new Callback<FinancialPositionResponse>() {
            @Override
            public void onResponse(@NonNull Call<FinancialPositionResponse> call, @NonNull Response<FinancialPositionResponse> response) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        FinancialPositionResponse.PositionData data = response.body().getData();
                        if (data != null) {
                            binding.tvNetWorth.setText(FormatUtils.formatCurrency(data.getNetWorth()));
                            binding.tvTotalAssets.setText(FormatUtils.formatCurrency(data.getTotalAssets()));
                            binding.tvTotalLiabilities.setText(FormatUtils.formatCurrency(data.getTotalLiabilities()));
                        }
                    } else {
                        Toast.makeText(requireContext(), "Failed to load financial position", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<FinancialPositionResponse> call, @NonNull Throwable t) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    Toast.makeText(requireContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
