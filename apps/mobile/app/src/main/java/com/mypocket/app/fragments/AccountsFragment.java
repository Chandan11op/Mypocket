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
import com.mypocket.app.models.Account;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.ErrorUtils;

import java.util.List;

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

        accountRepository = AccountRepository.getInstance(requireContext());
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

        binding.btnAddAccount.setOnClickListener(v -> startActivity(new Intent(requireContext(), AddAccountActivity.class)));
        binding.swipeRefresh.setOnRefreshListener(() -> loadAccounts(true));

        // 1. Instantly display cached data if available (NO full screen spinner!)
        if (accountRepository.hasCachedAccounts()) {
            adapter.setAccounts(accountRepository.getCachedAccounts());
        }

        // 2. Silent background refresh
        loadAccounts(false);
    }

    @Override
    public void onResume() {
        super.onResume();
        loadAccounts(false);
    }

    private void loadAccounts(boolean isManualPullToRefresh) {
        if (!isAdded()) return;

        boolean hasCache = accountRepository.hasCachedAccounts();
        if (isManualPullToRefresh || !hasCache) {
            binding.swipeRefresh.setRefreshing(true);
        }

        accountRepository.getAccounts(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountsListResponse> call, @NonNull Response<AccountsListResponse> response) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        List<Account> accounts = response.body().getAccounts();
                        adapter.setAccounts(accounts);
                    } else {
                        String errMsg = ErrorUtils.parseError(response);
                        if (!accountRepository.hasCachedAccounts()) {
                            Toast.makeText(requireContext(), errMsg, Toast.LENGTH_LONG).show();
                        }
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountsListResponse> call, @NonNull Throwable t) {
                if (isAdded()) {
                    binding.swipeRefresh.setRefreshing(false);
                    String errMsg = ErrorUtils.parseFailure(t);
                    if (!accountRepository.hasCachedAccounts()) {
                        Toast.makeText(requireContext(), errMsg, Toast.LENGTH_SHORT).show();
                    }
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
