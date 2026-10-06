package com.mypocket.app.activities;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.mypocket.app.R;
import com.mypocket.app.databinding.ActivityReconcileBinding;
import com.mypocket.app.models.ReconciliationResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.utils.FormatUtils;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ReconcileActivity extends AppCompatActivity {

    private ActivityReconcileBinding binding;
    private AccountRepository accountRepository;
    private String accountId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityReconcileBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        accountRepository = new AccountRepository(this);

        accountId = getIntent().getStringExtra("account_id");
        String name = getIntent().getStringExtra("account_name");
        double balance = getIntent().getDoubleExtra("balance", 0);

        binding.tvAccountName.setText(name != null ? name : "Account");
        binding.tvSystemBalance.setText(FormatUtils.formatCurrency(balance));

        binding.btnSubmitReconcile.setOnClickListener(v -> submitReconciliation());
    }

    private void submitReconciliation() {
        if (accountId == null) return;

        String actualStr = binding.etActualBalance.getText() != null ? binding.etActualBalance.getText().toString().trim() : "";
        if (actualStr.isEmpty()) {
            Toast.makeText(this, "Please enter actual balance", Toast.LENGTH_SHORT).show();
            return;
        }

        double actualBalance;
        try {
            actualBalance = Double.parseDouble(actualStr);
        } catch (Exception e) {
            Toast.makeText(this, "Invalid balance amount", Toast.LENGTH_SHORT).show();
            return;
        }

        binding.btnSubmitReconcile.setEnabled(false);
        accountRepository.reconcileAccount(accountId, actualBalance, "Mobile Reconciliation", new Callback<ReconciliationResponse>() {
            @Override
            public void onResponse(@NonNull Call<ReconciliationResponse> call, @NonNull Response<ReconciliationResponse> response) {
                binding.btnSubmitReconcile.setEnabled(true);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    ReconciliationResponse.Data data = response.body().getData();
                    binding.layoutResult.setVisibility(View.VISIBLE);

                    if (data != null && data.isReconciled()) {
                        binding.tvStatusBadge.setText("✓ Reconciled");
                        binding.tvStatusBadge.setTextColor(ContextCompat.getColor(ReconcileActivity.this, R.color.income_green));
                        Toast.makeText(ReconcileActivity.this, "Account Reconciled!", Toast.LENGTH_SHORT).show();
                    } else {
                        double diff = data != null ? data.getVariance() : 0;
                        binding.tvStatusBadge.setText("⚠ Unreconciled (Diff: " + FormatUtils.formatCurrency(diff) + ")");
                        binding.tvStatusBadge.setTextColor(ContextCompat.getColor(ReconcileActivity.this, R.color.expense_red));
                        Toast.makeText(ReconcileActivity.this, "Variance detected", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(ReconcileActivity.this, "Reconciliation failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ReconciliationResponse> call, @NonNull Throwable t) {
                binding.btnSubmitReconcile.setEnabled(true);
                Toast.makeText(ReconcileActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
