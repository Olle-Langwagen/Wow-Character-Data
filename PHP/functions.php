<?php
    include "defines.php";

    function generateAcccessToken(){

        $params = array(
            "grant_type" => "client_credentials",
            "client_id" => CLIENTID,
            "client_secret" => CLIENTSECRET
        );
        $tokenUri = "https://us.battle.net/oauth/token";

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_USERPWD, CLIENTID. ":". CLIENTSECRET);
        curl_setopt($ch, CURLOPT_URL, $tokenUri);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $accessTokenResponse = json_decode($response, true);

        if (isset($accessTokenResponse["access_token"])) {
            $status = "ok"
            $messege = "Access Token Generated";
        } else {
            $status = "error";
            $messege = "Access Token Generation Failed";
        }

        $response = array(
            "status" => $status,
            "messege" => $messege,
            "access_token" => $accessTokenResponse["access_token"]
        );
        
    }