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
import com.mypocket.app.databinding.FragmentTransactionsBinding;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.AccountTransactionsResponse;
import com.mypocket.app.repository.AccountRepository;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TransactionsFragment extends Fragment {

    private FragmentTransactionsBinding binding;
    private AccountRepository accountRepository;
    private TransactionAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentTransactionsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        accountRepository = new AccountRepository(requireContext());
        adapter = new TransactionAdapter();

        binding.rvTransactions.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvTransactions.setAdapter(adapter);

        binding.btnAddTx.setOnClickListener(v -> startActivity(new Intent(requireContext(), AddTransactionActivity.class)));
        binding.swipeRefresh.setOnRefreshListener(this::loadTransactions);

        loadTransactions();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadTransactions();
    }

    private void loadTransactions() {
        binding.swipeRefresh.setRefreshing(true);
        accountRepository.getAccounts(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountsListResponse> call, @NonNull Response<AccountsListResponse> response) {
                if (isAdded() && response.isSuccessful() && response.body() != null && response.body().getAccounts() != null && !response.body().getAccounts().isEmpty()) {
                    String firstAccountId = response.body().getAccounts().get(0).getId();
                    accountRepository.getAccountTransactions(firstAccountId, "desc", new Callback<AccountTransactionsResponse>() {
                        @Override
                        public void onResponse(@NonNull Call<AccountTransactionsResponse> call1, @NonNull Response<AccountTransactionsResponse> response1) {
                            if (isAdded()) {
                                binding.swipeRefresh.setRefreshing(false);
                                if (response1.isSuccessful() && response1.body() != null) {
                                    adapter.setTransactions(response1.body().getTransactions());
                                }
                            }
                        }

                        @Override
                        public void onFailure(@NonNull Call<AccountTransactionsResponse> call1, @NonNull Throwable t) {
                            if (isAdded()) binding.swipeRefresh.setRefreshing(false);
                        }
                    });
                } else {
                    if (isAdded()) binding.swipeRefresh.setRefreshing(false);
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountsListResponse> call, @NonNull Throwable t) {
                if (isAdded()) binding.swipeRefresh.setRefreshing(false);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
