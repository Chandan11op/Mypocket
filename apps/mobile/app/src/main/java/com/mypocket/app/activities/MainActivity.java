package com.mypocket.app.activities;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.mypocket.app.R;
import com.mypocket.app.databinding.ActivityMainBinding;
import com.mypocket.app.fragments.AccountsFragment;
import com.mypocket.app.fragments.AiFragment;
import com.mypocket.app.fragments.HomeFragment;
import com.mypocket.app.fragments.ProfileFragment;
import com.mypocket.app.fragments.TransactionsFragment;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        loadFragment(new HomeFragment());

        binding.bottomNavigation.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_home) {
                loadFragment(new HomeFragment());
                return true;
            } else if (itemId == R.id.nav_accounts) {
                loadFragment(new AccountsFragment());
                return true;
            } else if (itemId == R.id.nav_transactions) {
                loadFragment(new TransactionsFragment());
                return true;
            } else if (itemId == R.id.nav_ai) {
                loadFragment(new AiFragment());
                return true;
            } else if (itemId == R.id.nav_profile) {
                loadFragment(new ProfileFragment());
                return true;
            }
            return false;
        });
    }

    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }
}
