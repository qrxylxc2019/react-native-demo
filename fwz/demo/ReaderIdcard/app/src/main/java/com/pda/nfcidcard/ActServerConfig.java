/**
 * 版权所有.(c)2008-2016.广州市森锐科技股份有限公司
 * 作者: Leo
 * 日期: 2016/7/13 16:16
 */
package com.pda.nfcidcard;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.*;

public class ActServerConfig extends Activity {

	private String server_address;
	private int server_port;

	private EditText server_address_tv;
	private EditText server_port_tv;
	private EditText etSetReadNum;

	private ImageView setOtg, setReadNum;
	private TextView tv_ok;
	private TextView tv_cancel;

	private boolean isOTG;
	private boolean isRepeat;
	private int repeatNum = 1;

	private String auth_address;
	private int auth_port;
	private String auth_ip;
	private String auth_action;
	private String auth_key;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.server_set);

		isOTG = ShareReferenceSaver.getBool(getApplicationContext(), "otg_set");
		isRepeat = ShareReferenceSaver.getBool(getApplicationContext(), "repeat_set");

		server_address_tv = (EditText) findViewById(R.id.orther_ip);
		server_port_tv = (EditText) findViewById(R.id.orther_port);
		etSetReadNum = (EditText) findViewById(R.id.et_set_read_num);
		tv_ok = (TextView) findViewById(R.id.btn_ok);
		tv_cancel = (TextView) findViewById(R.id.btn_cancel);
		setOtg = (ImageView) findViewById(R.id.bnt_set_otg);
		setReadNum = (ImageView)findViewById(R.id.bnt_set_read_num);

		tv_ok.setOnClickListener(mylistener);
		tv_cancel.setOnClickListener(mylistener);
		setOtg.setOnClickListener(mylistener);
		setReadNum.setOnClickListener(mylistener);

		try {
			server_address = ShareReferenceSaver.getData(this, "server_address");
			server_port = Integer.valueOf(ShareReferenceSaver.getData(this, "server_port"));
		}catch (Exception e){
			server_address = "";
			server_port = 0;
		}

		if(server_address != null && !server_address.equals("")){
			server_address_tv.setText(server_address);
			server_port_tv.setText(server_port + "");
		}

		if(isRepeat){
			setReadNum.setImageResource(R.mipmap.control_on);
			repeatNum = Integer.valueOf(ShareReferenceSaver.getData(getApplicationContext(), "repeat_num"));
		}else {
			setReadNum.setImageResource(R.mipmap.control_off);
		}

		etSetReadNum.setText(String.valueOf(repeatNum));

		if(isOTG){
			setOtg.setImageResource(R.mipmap.control_on);
		}else {
			setOtg.setImageResource(R.mipmap.control_off);
		}

		try {
			auth_address = ShareReferenceSaver.getData(this, "auth_address");
			auth_port = Integer.valueOf(ShareReferenceSaver.getData(this, "auth_port"));
			auth_ip = ShareReferenceSaver.getData(this, "auth_ip");
			auth_action = ShareReferenceSaver.getData(this, "auth_action");
			auth_key = ShareReferenceSaver.getData(this, "auth_key");
		}catch (Exception e){
			auth_address = "";
			auth_port = 0;
			auth_ip = "";
			auth_action = "";
			auth_key = "";
		}

	}

	View.OnClickListener mylistener = new View.OnClickListener() {

		@Override
		public void onClick(View v) {
			switch (v.getId()) {
				case R.id.btn_ok:
					buttonok();
					break;

				case R.id.btn_cancel:
					finish();
					break;

				case R.id.bnt_set_otg:
					if(isOTG){
						isOTG = false;
						setOtg.setImageResource(R.mipmap.control_off);
					}else {
						isOTG = true;
						setOtg.setImageResource(R.mipmap.control_on);
					}
					break;

				case R.id.bnt_set_read_num:
					if(isRepeat){
						isRepeat = false;
						setReadNum.setImageResource(R.mipmap.control_off);
					}else {
						isRepeat = true;
						setReadNum.setImageResource(R.mipmap.control_on);
					}
					break;
			}
		}
	};

	private void buttonok() {
		saveconfig();

		Log.e(this.getClass().getName(), "select: " + server_address);
		Log.e(this.getClass().getName(), "select: " + server_port);

		if (server_address.length() < 0) {
			Toast.makeText(ActServerConfig.this, R.string.choose_server_tip,
					Toast.LENGTH_LONG).show();
			return;
		}

		// Set result and finish this Activity
		setResult(100);
		finish();
	}

	private void saveconfig() {

		server_address = String.valueOf(server_address_tv.getText());
		if (server_port_tv.getText().length() <= 0 || server_address.equals("")) {
			server_port = 0;
			ShareReferenceSaver.saveData(getApplicationContext(), "server_address", "");
			ShareReferenceSaver.saveData(getApplicationContext(), "server_port", "0");
		} else {
			server_port = new Integer(
					String.valueOf(server_port_tv.getText()));
			ShareReferenceSaver.saveData(getApplicationContext(), "server_address", server_address);
			ShareReferenceSaver.saveData(getApplicationContext(), "server_port", server_port+"");
		}

		if(isOTG){
			ShareReferenceSaver.saveBool(getApplicationContext(), "otg_set", true);
		}else {
			ShareReferenceSaver.saveBool(getApplicationContext(), "otg_set", false);
		}

		if(isRepeat){
			ShareReferenceSaver.saveBool(getApplicationContext(), "repeat_set", true);
			repeatNum = Integer.valueOf(etSetReadNum.getText().toString());
			if(repeatNum > 0) {
				ShareReferenceSaver.saveData(getApplicationContext(), "repeat_num", String.valueOf(repeatNum));
			}else {
				ShareReferenceSaver.saveData(getApplicationContext(), "repeat_num", "1");
			}
		}else {
			ShareReferenceSaver.saveBool(getApplicationContext(), "repeat_set", false);
			ShareReferenceSaver.saveData(getApplicationContext(), "repeat_num", "1");
		}
	}

}
