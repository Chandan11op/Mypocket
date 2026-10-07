package com.mypocket.app.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.mypocket.app.activities.AddTransactionActivity;
import com.mypocket.app.adapters.TransactionAdapter;
import com.mypocket.app.databinding.FragmentHomeBinding;
import com.mypocket.app.models.Account;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.FinancialPositionResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.FormatUtils;

import java.util.List;

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
        if (!isAdded()) return;
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
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<FinancialPositionResponse> call, @NonNull Throwable t) {
                if (isAdded()) binding.swipeRefresh.setRefreshing(false);
            }
        });

        accountRepository.getAccounts(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountsListResponse> call, @NonNull Response<AccountsListResponse> response) {
                if (isAdded() && response.isSuccessful() && response.body() != null && response.body().getAccounts() != null) {
                    List<Account> accounts = response.body().getAccounts();
                    double cashBank = 0;
                    double investments = 0;
                    double receivables = 0;
                    double payables = 0;

                    for (Account acc : accounts) {
                        String type = acc.getAccountType().toUpperCase();
                        String aClass = acc.getAccountClass().toUpperCase();
                        double bal = acc.getBalance();

                        if ("CASH".equals(type) || "BANK".equals(type) || "WALLET".equals(type)) {
                            cashBank += bal;
                        } else if ("INVESTMENT".equals(type)) {
                            investments += bal;
                        } else if ("RECEIVABLE".equals(type)) {
                            receivables += bal;
                        } else if ("LIABILITY".equalsIgnoreCase(aClass) || "CREDIT_CARD".equals(type) || "LOAN".equals(type)) {
                            payables += bal;
                        }
                    }

                    binding.tvCashBank.setText(FormatUtils.formatCurrency(cashBank));
                    binding.tvInvestments.setText(FormatUtils.formatCurrency(investments));
                    binding.tvReceivables.setText(FormatUtils.formatCurrency(receivables));
                    binding.tvPayables.setText(FormatUtils.formatCurrency(payables));
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountsListResponse> call, @NonNull Throwable t) {}
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
