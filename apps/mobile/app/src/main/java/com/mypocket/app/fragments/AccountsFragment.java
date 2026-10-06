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

import com.mypocket.app.activities.AccountDetailActivity;
import com.mypocket.app.activities.AddAccountActivity;
import com.mypocket.app.adapters.AccountAdapter;
import com.mypocket.app.databinding.FragmentAccountsBinding;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.repository.AccountRepository;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AccountsFragment extends Fragment {

    private FragmentAccountsBinding binding;
    private AccountRepository accountRepository;
    private AccountAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentAccountsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        accountRepository = new AccountRepository(requireContext());
        adapter = new AccountAdapter(account -> {
            Intent intent = new Intent(requireContext(), AccountDetailActivity.class);
            intent.putExtra("account_id", account.getId());
            intent.putExtra("account_name", account.getName());
            intent.putExtra("account_class", account.getAccountClass());
            intent.putExtra("account_type", account.getAccountType());
            intent.putExtra("institution", account.getInstitutionName());
            intent.putExtra("balance", account.getBalance());
            startActivity(intent);
        });

        binding.rvAccounts.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvAccounts.setAdapter(adapter);

        binding.btnAddAccount.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), AddAccountActivity.class));
        });

        binding.swipeRefresh.setOnRefreshListener(this::loadAccounts);

        loadAccounts();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadAccounts();
    }

    private void loadAccounts() {
        binding.swipeRefresh.setRefreshing(true);
        accountRepository.getAccounts(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountsListResponse> call, @NonNull Response<AccountsListResponse> response) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        adapter.setAccounts(response.body().getAccounts());
                    } else {
                        Toast.makeText(requireContext(), "Failed to load accounts", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountsListResponse> call, @NonNull Throwable t) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
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
