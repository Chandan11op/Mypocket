package com.mypocket.app.activities;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.mypocket.app.databinding.ActivityAddTransactionBinding;
import com.mypocket.app.models.Account;
import com.mypocket.app.models.AccountingTransactionRequest;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.repository.AccountRepository;
import com.mypocket.app.repository.TransactionRepository;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddTransactionActivity extends AppCompatActivity {

    private ActivityAddTransactionBinding binding;
    private TransactionRepository transactionRepository;
    private AccountRepository accountRepository;

    private final List<Account> accountList = new ArrayList<>();
    private final List<String> accountNames = new ArrayList<>();
    private final String[] txTypes = {
            "Expense", "Income", "Transfer Money", "Investment",
            "Borrow Money", "Repay Borrowed Money", "Lend Money", "Receive Money Back"
    };
    private final String[] txTypeKeys = {
            "EXPENSE", "INCOME", "TRANSFER", "INVESTMENT",
            "BORROW", "REPAYMENT", "LEND", "RECEIVABLE_PAYMENT"
    };

    private Calendar selectedCalendar = Calendar.getInstance();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAddTransactionBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        transactionRepository = new TransactionRepository(this);
        accountRepository = new AccountRepository(this);

        updateDateField();

        binding.etDate.setOnClickListener(v -> showDatePicker());

        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, txTypes);
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spType.setAdapter(typeAdapter);

        binding.spType.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                configureFormForType(txTypeKeys[position]);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        loadUserAccounts();

        binding.btnSaveTransaction.setOnClickListener(v -> submitTransaction());
    }

    private void showDatePicker() {
        DatePickerDialog dialog = new DatePickerDialog(this, (view, year, month, dayOfMonth) -> {
            selectedCalendar.set(Calendar.YEAR, year);
            selectedCalendar.set(Calendar.MONTH, month);
            selectedCalendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
            updateDateField();
        }, selectedCalendar.get(Calendar.YEAR), selectedCalendar.get(Calendar.MONTH), selectedCalendar.get(Calendar.DAY_OF_MONTH));
        dialog.show();
    }

    private void updateDateField() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        binding.etDate.setText(sdf.format(selectedCalendar.getTime()));
    }

    private void loadUserAccounts() {
        accountRepository.getAccounts(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(@NonNull Call<AccountsListResponse> call, @NonNull Response<AccountsListResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getAccounts() != null) {
                    accountList.clear();
                    accountNames.clear();
                    accountList.addAll(response.body().getAccounts());

                    for (Account acc : accountList) {
                        accountNames.add(acc.getName() + " (" + acc.getAccountClass() + ")");
                    }

                    ArrayAdapter<String> accAdapter = new ArrayAdapter<>(AddTransactionActivity.this, android.R.layout.simple_spinner_item, accountNames);
                    accAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                    binding.spFromAccount.setAdapter(accAdapter);
                    binding.spToAccount.setAdapter(accAdapter);
                }
            }

            @Override
            public void onFailure(@NonNull Call<AccountsListResponse> call, @NonNull Throwable t) {
                Toast.makeText(AddTransactionActivity.this, "Failed to load accounts", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void configureFormForType(String key) {
        switch (key) {
            case "EXPENSE":
                binding.lblFromAccount.setText("Paid via (Asset Account)");
                binding.lblToAccount.setVisibility(View.GONE);
                binding.spToAccount.setVisibility(View.GONE);
                binding.tlPerson.setVisibility(View.VISIBLE);
                binding.tlPerson.setHint("To (Person / Shop / Company)");
                break;
            case "INCOME":
                binding.lblFromAccount.setVisibility(View.GONE);
                binding.spFromAccount.setVisibility(View.GONE);
                binding.lblToAccount.setVisibility(View.VISIBLE);
                binding.lblToAccount.setText("Received in (Asset Account)");
                binding.spToAccount.setVisibility(View.VISIBLE);
                binding.tlPerson.setVisibility(View.VISIBLE);
                binding.tlPerson.setHint("From (Person / Employer / Client)");
                break;
            case "TRANSFER":
                binding.lblFromAccount.setVisibility(View.VISIBLE);
                binding.lblFromAccount.setText("From Account");
                binding.spFromAccount.setVisibility(View.VISIBLE);
                binding.lblToAccount.setVisibility(View.VISIBLE);
                binding.lblToAccount.setText("To Account");
                binding.spToAccount.setVisibility(View.VISIBLE);
                binding.tlPerson.setVisibility(View.GONE);
                break;
            default:
                binding.lblFromAccount.setVisibility(View.VISIBLE);
                binding.spFromAccount.setVisibility(View.VISIBLE);
                binding.lblToAccount.setVisibility(View.VISIBLE);
                binding.spToAccount.setVisibility(View.VISIBLE);
                binding.tlPerson.setVisibility(View.VISIBLE);
                break;
        }
    }

    private void submitTransaction() {
        String amountStr = binding.etAmount.getText() != null ? binding.etAmount.getText().toString().trim() : "";
        if (amountStr.isEmpty()) {
            Toast.makeText(this, "Please enter amount", Toast.LENGTH_SHORT).show();
            return;
        }

        double amount;
        try {
            amount = Double.parseDouble(amountStr);
        } catch (Exception e) {
            Toast.makeText(this, "Invalid amount", Toast.LENGTH_SHORT).show();
            return;
        }

        int typeIndex = binding.spType.getSelectedItemPosition();
        String typeKey = txTypeKeys[typeIndex];

        AccountingTransactionRequest req = new AccountingTransactionRequest();
        req.setTransactionType(typeKey);
        req.setAmount(amount);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        req.setDate(sdf.format(selectedCalendar.getTime()));

        String desc = binding.etDescription.getText() != null ? binding.etDescription.getText().toString().trim() : "";
        req.setDescription(desc.isEmpty() ? typeKey : desc);

        int fromPos = binding.spFromAccount.getSelectedItemPosition();
        int toPos = binding.spToAccount.getSelectedItemPosition();

        if (fromPos >= 0 && fromPos < accountList.size()) {
            req.setFromAccountId(accountList.get(fromPos).getId());
        }
        if (toPos >= 0 && toPos < accountList.size()) {
            req.setToAccountId(accountList.get(toPos).getId());
        }

        String personName = binding.etPerson.getText() != null ? binding.etPerson.getText().toString().trim() : "";
        if (!personName.isEmpty()) {
            req.setPersonName(personName);
        }

        binding.btnSaveTransaction.setEnabled(false);
        transactionRepository.createTransaction(req, new Callback<GenericResponse>() {
            @Override
            public void onResponse(@NonNull Call<GenericResponse> call, @NonNull Response<GenericResponse> response) {
                binding.btnSaveTransaction.setEnabled(true);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(AddTransactionActivity.this, "Transaction recorded!", Toast.LENGTH_SHORT).show();
                    finish();
                } else {
                    Toast.makeText(AddTransactionActivity.this, "Failed to record transaction", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<GenericResponse> call, @NonNull Throwable t) {
                binding.btnSaveTransaction.setEnabled(true);
                Toast.makeText(AddTransactionActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
