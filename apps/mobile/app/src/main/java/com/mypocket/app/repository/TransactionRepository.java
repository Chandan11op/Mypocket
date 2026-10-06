package com.mypocket.app.repository;

import android.content.Context;

import com.mypocket.app.models.AccountingTransactionRequest;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.PersonsListResponse;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.network.ApiService;

import retrofit2.Callback;

public class TransactionRepository {
    private final ApiService apiService;

    public TransactionRepository(Context context) {
        this.apiService = ApiClient.getService(context);
    }

    public void createTransaction(AccountingTransactionRequest request, Callback<GenericResponse> callback) {
        apiService.createAccountingTransaction(request).enqueue(callback);
    }

    public void getPersons(Callback<PersonsListResponse> callback) {
        apiService.getPersons().enqueue(callback);
    }
}
