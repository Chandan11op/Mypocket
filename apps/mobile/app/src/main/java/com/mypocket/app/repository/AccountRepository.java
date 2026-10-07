package com.mypocket.app.repository;

import android.content.Context;

import com.mypocket.app.models.Account;
import com.mypocket.app.models.AccountTransactionsResponse;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.CreateAccountRequest;
import com.mypocket.app.models.FinancialPositionResponse;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.ReconciliationRequest;
import com.mypocket.app.models.ReconciliationResponse;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.network.ApiService;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AccountRepository {
    private static AccountRepository instance;
    private final ApiService apiService;

    // In-memory Cache
    private List<Account> cachedAccounts = null;
    private FinancialPositionResponse.PositionData cachedPosition = null;

    public static synchronized AccountRepository getInstance(Context context) {
        if (instance == null) {
            instance = new AccountRepository(context.getApplicationContext());
        }
        return instance;
    }

    public AccountRepository(Context context) {
        this.apiService = ApiClient.getService(context);
    }

    public boolean hasCachedAccounts() {
        return cachedAccounts != null && !cachedAccounts.isEmpty();
    }

    public List<Account> getCachedAccounts() {
        return cachedAccounts != null ? cachedAccounts : new ArrayList<>();
    }

    public FinancialPositionResponse.PositionData getCachedPosition() {
        return cachedPosition;
    }

    public void getAccounts(Callback<AccountsListResponse> callback) {
        getAccounts(false, callback);
    }

    public void getAccounts(boolean forceRefresh, Callback<AccountsListResponse> callback) {
        apiService.getAccounts().enqueue(new Callback<AccountsListResponse>() {
            @Override
            public void onResponse(Call<AccountsListResponse> call, Response<AccountsListResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    cachedAccounts = response.body().getAccounts();
                }
                if (callback != null) {
                    callback.onResponse(call, response);
                }
            }

            @Override
            public void onFailure(Call<AccountsListResponse> call, Throwable t) {
                if (callback != null) {
                    callback.onFailure(call, t);
                }
            }
        });
    }

    public void createAccount(CreateAccountRequest request, Callback<GenericResponse> callback) {
        apiService.createAccount(request).enqueue(new Callback<GenericResponse>() {
            @Override
            public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                if (response.isSuccessful()) {
                    cachedAccounts = null; // Invalidate cache after account creation
                }
                if (callback != null) {
                    callback.onResponse(call, response);
                }
            }

            @Override
            public void onFailure(Call<GenericResponse> call, Throwable t) {
                if (callback != null) {
                    callback.onFailure(call, t);
                }
            }
        });
    }

    public void getAccountTransactions(String accountId, String sortOrder, Callback<AccountTransactionsResponse> callback) {
        apiService.getAccountTransactions(accountId, sortOrder).enqueue(callback);
    }

    public void getFinancialPosition(Callback<FinancialPositionResponse> callback) {
        apiService.getFinancialPosition().enqueue(new Callback<FinancialPositionResponse>() {
            @Override
            public void onResponse(Call<FinancialPositionResponse> call, Response<FinancialPositionResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    cachedPosition = response.body().getData();
                }
                if (callback != null) {
                    callback.onResponse(call, response);
                }
            }

            @Override
            public void onFailure(Call<FinancialPositionResponse> call, Throwable t) {
                if (callback != null) {
                    callback.onFailure(call, t);
                }
            }
        });
    }

    public void reconcileAccount(String accountId, double actualBalance, String notes, Callback<ReconciliationResponse> callback) {
        apiService.reconcileAccount(accountId, new ReconciliationRequest(actualBalance, notes)).enqueue(new Callback<ReconciliationResponse>() {
            @Override
            public void onResponse(Call<ReconciliationResponse> call, Response<ReconciliationResponse> response) {
                if (response.isSuccessful()) {
                    cachedAccounts = null; // Invalidate cache after reconciliation
                    cachedPosition = null;
                }
                if (callback != null) {
                    callback.onResponse(call, response);
                }
            }

            @Override
            public void onFailure(Call<ReconciliationResponse> call, Throwable t) {
                if (callback != null) {
                    callback.onFailure(call, t);
                }
            }
        });
    }

    public void clearCache() {
        cachedAccounts = null;
        cachedPosition = null;
    }
}
