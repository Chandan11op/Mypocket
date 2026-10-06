package com.mypocket.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.mypocket.app.R;
import com.mypocket.app.models.Account;
import com.mypocket.app.utils.FormatUtils;

import java.util.ArrayList;
import java.util.List;

public class AccountAdapter extends RecyclerView.Adapter<AccountAdapter.ViewHolder> {

    public interface OnAccountClickListener {
        void onAccountClick(Account account);
    }

    private final List<Account> accounts = new ArrayList<>();
    private final OnAccountClickListener listener;

    public AccountAdapter(OnAccountClickListener listener) {
        this.listener = listener;
    }

    public void setAccounts(List<Account> newAccounts) {
        accounts.clear();
        if (newAccounts != null) {
            accounts.addAll(newAccounts);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_account, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Account account = accounts.get(position);
        holder.tvName.setText(account.getName());

        String details = account.getAccountClass() + " • " + account.getAccountType();
        if (account.getInstitutionName() != null && !account.getInstitutionName().isEmpty()) {
            details += " (" + account.getInstitutionName() + ")";
        }
        holder.tvType.setText(details);

        holder.tvBalance.setText(FormatUtils.formatCurrency(account.getBalance()));

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onAccountClick(account);
            }
        });
    }

    @Override
    public int getItemCount() {
        return accounts.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvType, tvBalance;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tv_account_name);
            tvType = itemView.findViewById(R.id.tv_account_type);
            tvBalance = itemView.findViewById(R.id.tv_account_balance);
        }
    }
}
