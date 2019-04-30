/*!
  * LQM API JS Library
  * Copyright 2019 LiquidM Technology GmbH (https://liquidm.com/)
  * Licensed under MIT (https://github.com/liquidm/liquidm-management-api/blob/master/LICENSE)
  */
/*--------------------------------------------------------------------------------------------------------------------*/
Date.prototype.addHours = Date.prototype.addHours || function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
};

/*--------------------------------------------------------------------------------------------------------------------*/
function API(settings) {
    this.settings = settings;
    this.settings.urlPrefixV1 = "https://platform.liquidm.com/api/v1/";
    this.settings.urlPrefixV2 = "https://platform.liquidm.com/api/v2/";
    this.clientVersion = '1.0';
}

/*----------------------------------------------------------------------------------------------------------------------
 * Example DataSource contains simplest JSON for each of the objects
 */
API.exampleDS = {};

API.exampleDS.campaign = {
    name: "new campaign",
    unit_type: "cpm",
    currency: "EUR",
    advertiser_domain: "example.com",
    price_optimization_enabled: true,
    timezone: "Berlin",
    // account_id: 12345,
    category_id: 5
};

API.exampleDS.budget = {
    start_date: (new Date).toISOString(),
    end_date: (new Date).addHours(24).toISOString(),
    unit_price_cents: 100,
    overall_cents: 200,
    overall_units: null,
    daily_cents: null,
    daily_units: 10,
    overall_units_pacing: "optimized",
    overall_cents_pacing: "optimized",
    daily_units_pacing: "optimized",
    daily_cents_pacing: "optimized",
    campaign_id: null
};

API.exampleDS.ad = {
    name: "New ad",
    overall_units: null,
    daily_units: null,
    section_order: [],
    campaign_id: 1234567,
    creative_section_id: null,
    creative_section_type: null,
    supply_section_id: null
};

/*----------------------------------------------------------------------------------------------------------------------
 * Private functions
 */
API.prototype._get = async function (url, params) {
    let fullURL = url + '?' + Object.keys(params).reduce((a, k) => a + k + '=' + encodeURIComponent(params[k]) + '&', '');
    let response = await $.ajax(fullURL + `auth_token=${this.settings.auth_token}`, {
        crossDomain: true,
        dataType: 'json'
    });
    return {method: 'GET', url: fullURL, data: params, response: response}
};

API.prototype._post = async function (url, data) {
    let params = {};
    let fullURL = url + '?' + Object.keys(params).reduce((a, k) => a + k + '=' + encodeURIComponent(params[k]) + '&', '');
    let response = await $.ajax(fullURL + `auth_token=${this.settings.auth_token}`, {
        crossDomain: true,
        type: "POST",
        dataType: 'json',
        data: data
    });
    return {method: 'POST', url: fullURL, data: data, response: response}
};

/*----------------------------------------------------------------------------------------------------------------------
 * Public methods
 */
API.prototype.getCampaigns = async function () {
    return await this._get(this.settings.urlPrefixV1 + 'campaigns', {account_id: this.settings.accountID});
};

API.prototype.getAds = async function (campaignID, embed) {
    return await this._get(this.settings.urlPrefixV1 + 'ads',
        {campaign_id: campaignID, embed: embed.join(',')});
};

API.prototype.createCampaign = async function (ds, dryrun) {
    let f = !dryrun ? this._post : this.emulateCreateCampaign;
    let results = await this.createBudget(ds, dryrun);
    ds.campaign.account_id = this.settings.accountID;
    ds.campaign.budget_ids = [results[0].response.budget.id];
    let result = await f.call(this, this.settings.urlPrefixV1 + 'campaigns', {campaign: ds.campaign}, ds);
    return results.concat(result);
};

API.prototype.createBudget = async function (ds, dryrun) {
    let f = !dryrun ? this._post : this.emulateCreateBudget;
    let result = await f.call(this, this.settings.urlPrefixV1 + 'budgets', {budget: ds.budget}, ds);
    return Array.of(result);
};

API.prototype.createAd = async function (ds, dryrun) {
    let f = !dryrun ? this._post : this.emulateCreateAd;
    let result = await f.call(this, this.settings.urlPrefixV1 + 'ads', {ad: ds.ad}, ds);
    return Array.of(result);
};

/*----------------------------------------------------------------------------------------------------------------------
 * Method emulation for dry run
 */
API.prototype.emulateCreateCampaign = async function (url, params, ds) {
    let result = {};
    result.method = 'POST';
    result.url = url;
    result.data = ds.campaign;
    result.response = {
        campaign: $.extend({
            id: 1234567,
            ad_ids: [],
            created_at: (new Date).toISOString(),
            updated_at: (new Date).toISOString(),
            budget_ids: [1234567],
            decision_interface: "bidopt",
            additional_name: null,
            campaign_info: null
        }, API.exampleDS.campaign, ds.campaign)
    };
    return result;
};

API.prototype.emulateCreateBudget = async function (url, params, ds) {
    let result = {};
    result.method = 'POST';
    result.url = url;
    result.data = ds.budget;
    result.response = {
        budget: $.extend({
            id: 1234567,
            budget_touched: false
        }, API.exampleDS.budget, ds.budget)
    };
    return result;
};

API.prototype.emulateCreateAd = async function (url, params, ds) {
    let result = {};
    result.method = 'POST';
    result.url = url;
    result.data = ds.ad;
    result.response = {
        ad: $.extend({
            id: 1234567,
            name: "New ad",
            state: "incomplete",
            approved: null,
            campaign_id: 1234567,
            section_order: ["Targeting", "Supply", "Creative", "Setting"],
            creative_id: 1234567,
            supply_id: 1234567,
            targeting_id: 1234567,
            setting_id: 1234567,
            overall_units: null,
            daily_units: null,
            delivery_warnings: ["Your creative uses non-secure connection(s). Make sure all requested assets have a secure connection (https)!"],
            delivery_errors: ["Your ad cannot deliver. Some required inputs are missing."],
            appnexus_approval_info: "AppNexus creative approval is PENDING.",
            created_at: (new Date).toISOString(),
            updated_at: (new Date).toISOString()
        }, API.exampleDS.ad, ds.ad),
        meta: {"errors": {"creative": ["is not valid"], "setting": ["is not valid"], "targeting": ["is not valid"]}}
    };
    return result;
};
/*--------------------------------------------------------------------------------------------------------------------*/