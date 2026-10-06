package com.mypocket.app.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.mypocket.app.adapters.TransactionAdapter;
import com.mypocket.app.databinding.ActivityAccountDetailBinding;
import com.mypocket.app.models.AccountTransactionsResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.FormatUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AccountDetailActivity extends AppCompatActivity {

    private ActivityAccountDetailBinding binding;
    private AccountRepository accountRepository;
    private TransactionAdapter adapter;
    private String accountId;
    private boolean isDesc = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAccountDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        accountRepository = new AccountRepository(this);
        adapter = new TransactionAdapter();

        accountId = getIntent().getStringExtra("account_id");
        String name = getIntent().getStringExtra("account_name");
        String aClass = getIntent().getStringExtra("account_class");
        String aType = getIntent().getStringExtra("account_type");
        double balance = getIntent().getDoubleExtra("balance", 0);

        binding.tvAccountName.setText(name != null ? name : "Account");
        binding.tvAccountType.setText((aClass != null ? aClass : "") + " / " + (aType != null ? aType : ""));
        binding.tvAccountBalance.setText(FormatUtils.formatCurrency(balance));

        binding.rvTransactions.setLayoutManager(new LinearLayoutManager(this));
        binding.rvTransactions.setAdapter(adapter);

        binding.btnToggleSort.setOnClickListener(v -> {
            isDesc = !isDesc;
            binding.btnToggleSort.setText(isDesc ? "Newest First" : "Oldest First");
            loadTransactions();
        });

        binding.btnReconcileAccount.setOnClickListener(v -> {
            Intent intent = new Intent(AccountDetailActivity.this, ReconcileActivity.class);
            intent.putExtra("account_id", accountId);
            intent.putExtra("account_name", name);
            intent.putExtra("balance", balance);
            startActivity(intent);
        });

        binding.swipeRefresh.setOnRefreshListener(this::loadTransactions);

        loadTransactions();
    }

    private void loadTransactions() {
        if (accountId == null) return;
        binding.swipeRefresh.setRefreshing(true);
        accountRepository.getAccountTransactions(accountId, isDesc ? "desc" : "asc", new Callback<AccountTransactionsResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountTransactionsResponse> call, @NonNull Response<AccountTransactionsResponse> response) {
                binding.swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setTransactions(response.body().getTransactions());
                } else {
                    Toast.makeText(AccountDetailActivity.this, "Failed to load transactions", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountTransactionsResponse> call, @NonNull Throwable t) {
                binding.swipeRefresh.setRefreshing(false);
                Toast.makeText(AccountDetailActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
