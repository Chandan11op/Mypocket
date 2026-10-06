package com.mypocket.app.repository;

import android.content.Context;

import com.mypocket.app.models.AccountTransactionsResponse;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.CreateAccountRequest;
import com.mypocket.app.models.FinancialPositionResponse;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.ReconciliationRequest;
import com.mypocket.app.models.ReconciliationResponse;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.network.ApiService;

import retrofit2.Callback;

public class AccountRepository {
    private final ApiService apiService;

    public AccountRepository(Context context) {
        this.apiService = ApiClient.getService(context);
    }

    public void getAccounts(Callback<AccountsListResponse> callback) {
        apiService.getAccounts().enqueue(callback);
    }

    public void createAccount(CreateAccountRequest request, Callback<GenericResponse> callback) {
        apiService.createAccount(request).enqueue(callback);
    }

    public void getAccountTransactions(String accountId, String sortOrder, Callback<AccountTransactionsResponse> callback) {
        apiService.getAccountTransactions(accountId, sortOrder).enqueue(callback);
    }

    public void getFinancialPosition(Callback<FinancialPositionResponse> callback) {
        apiService.getFinancialPosition().enqueue(callback);
    }

    public void reconcileAccount(String accountId, double actualBalance, String notes, Callback<ReconciliationResponse> callback) {
        apiService.reconcileAccount(accountId, new ReconciliationRequest(actualBalance, notes)).enqueue(callback);
    }
}
