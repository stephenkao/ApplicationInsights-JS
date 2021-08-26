import { AITestClass } from "@microsoft/ai-test-framework";
import { Sender } from "../../../src/Sender";
import { Metric, IMetricTelemetry } from "@microsoft/applicationinsights-common";
import { AppInsightsCore, _InternalMessageId } from "@microsoft/applicationinsights-core-js";
import { Statsbeat } from "../../../src/Statsbeat";
import { StatsbeatCounter } from "../../../src/Constants";

Statsbeat.INSTRUMENTATION_KEY = "2aa22222-bbbb-1ccc-8ddd-eeeeffff3333";
var strEmpty = "";
const endpoint = "https://dc.services.visualstudio.com/v2/track";
export class StatsbeatTests extends AITestClass {
    private _sender: Sender;
    private _statsbeat: Statsbeat;

    public testInitialize() {
        this._statsbeat = new Statsbeat();
        this._sender = new Sender(this._statsbeat);
    }

    public testCleanup() {
        this._statsbeat = null;
        this._sender = null;
    }

    public registerTests() {
        this.testCase({
            name: "Statsbeat by default is enabled and is initialized while sender is initialized.",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.equal(this._statsbeat["_isEnabled"], true, "By default, statsbeat is enabled.");
            }
        });

        this.testCase({
            name: "Statsbeat is disabled if customer configured to disable statsbeat.",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        disableStatsbeat: true,
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.equal(this._statsbeat["_isEnabled"], false, "Statsbeat is disabled with customer configuration.");
            }
        });

        this.testCase({
            name: "It adds correct network properties to custom metric.",
            test: () => {
                // the first xhr gets created when _sender calls initialize; the second xhr gest created when statsbeat's sender calls initialize
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                const spy = this.sandbox.spy(this._statsbeat["_sender"], "triggerSend");
                // the third xhr gets created when track is called and the current _sender creates a xhr to send data
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(spy.callCount, 1, "should call sender");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");

                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + Statsbeat.INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, Statsbeat.INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], "https://dc.services.visualstudio.com/v2/track");
            }
        });

        this.testCase({
            name: "Track duration.",
            test: () => {
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                const spy = this.sandbox.spy(this._statsbeat["_sender"], "triggerSend");
                this._statsbeat.countRequest(endpoint, 1000, true);
                this._statsbeat.countRequest(endpoint, 500, false);
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(spy.callCount, 1, "should call sender");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                
                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + Statsbeat.INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, Statsbeat.INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], endpoint);
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_DURATION], "750");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_SUCCESS], "1");
            }
        });

        this.testCase({
            name: "Track counts.",
            test: () => {
                this._sender.initialize({ instrumentationKey: "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333" }, new AppInsightsCore(), []);
                const spy = this.sandbox.spy(this._statsbeat["_sender"], "triggerSend");
                this._statsbeat.countRequest(endpoint, 1, true);
                this._statsbeat.countRequest(endpoint, 1, true);
                this._statsbeat.countRequest(endpoint, 1, true);
                this._statsbeat.countRequest(endpoint, 1, true);
                this._statsbeat.countRequest(endpoint, 1, false);
                this._statsbeat.countRequest(endpoint, 1, false);
                this._statsbeat.countRequest(endpoint, 1, false);
                this._statsbeat.countRetry(endpoint);
                this._statsbeat.countRetry(endpoint);
                this._statsbeat.countThrottle(endpoint);
                this._statsbeat.countException(endpoint);
                this._statsbeat.trackShortIntervalStatsbeats();

                QUnit.assert.equal(spy.callCount, 1, "should call sender");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                
                // we only care the last object that's about to send
                const arr = JSON.parse(this._getXhrRequests()[0].requestBody);
                let fakeReq = arr[arr.length - 1];
                console.log(fakeReq);
                QUnit.assert.equal(fakeReq.name, "Microsoft.ApplicationInsights." + Statsbeat.INSTRUMENTATION_KEY.replace(/-/g, strEmpty) + ".Metric");
                QUnit.assert.equal(fakeReq.iKey, Statsbeat.INSTRUMENTATION_KEY);
                QUnit.assert.equal(fakeReq.data.baseType, Metric.dataType);

                let baseData: IMetricTelemetry = fakeReq.data.baseData;
                QUnit.assert.equal(baseData.properties["cikey"], "1aa11111-bbbb-1ccc-8ddd-eeeeffff3333");
                QUnit.assert.equal(baseData.properties["host"], endpoint);
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_DURATION], "1");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_SUCCESS], "4");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.REQUEST_FAILURE], "3");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.RETRY_COUNT], "2");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.THROTTLE_COUNT], "1");
                QUnit.assert.equal(baseData.properties[StatsbeatCounter.EXCEPTION_COUNT], "1");
            }
        });
    }
}