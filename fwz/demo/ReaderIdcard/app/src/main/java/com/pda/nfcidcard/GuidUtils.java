package com.pda.nfcidcard;

import java.util.Locale;
import java.util.UUID;

/**
 * UUID
 *
 */
public class GuidUtils {
	private String uuid;

	private GuidUtils() {
	}
	
	public String getCurrentId() {
		if(uuid==null){
			uuid=newRandom();
		}
		return uuid;
	}
	private static GuidUtils guidUtils;
	public static GuidUtils getInstance() {
		if(guidUtils==null){
			guidUtils=new GuidUtils();
		}
		return guidUtils;
	}
	
	public String newRandom() {
		uuid=UUID.randomUUID().toString().toUpperCase(Locale.getDefault());
		return uuid;
	}

	public void clearUUID(){
		uuid = null;
	}
}
