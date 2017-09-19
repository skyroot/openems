import { DefaultTypes } from '../service/defaulttypes'

export class ConfigImpl implements DefaultTypes.Config {

    // Attributes from Config interface
    public readonly things: {
        [id: string]: {
            id: string,
            class: string | string[],
            [channel: string]: any
        }
    };
    public readonly meta: {
        [clazz: string]: {
            implements: [string],
            channels: {
                [channel: string]: {
                    name: string,
                    title: string,
                    type: string | string[],
                    optional: boolean,
                    array: boolean,
                    accessLevel: string
                    defaultValue: string
                }
            }
        }
    };

    // A list of thing ids which are matching Natures. (e.g. ["ess0", "ess1"])
    public readonly storageThings: string[] = [];
    public readonly gridMeters: string[] = [];
    public readonly productionMeters: string[] = [];
    public readonly bridges: string[] = [];
    public readonly scheduler: string = null;
    public readonly controllers: string[] = [];
    public readonly simulatorDevices: string[] = [];

    constructor(private readonly config: DefaultTypes.Config) {
        Object.assign(this, config);

        let storageThings: string[] = []
        let gridMeters: string[] = [];
        let productionMeters: string[] = [];
        let bridges: string[] = [];
        let scheduler: string = null;
        let controllers: string[] = [];
        let simulatorDevices: string[] = [];

        for (let thingId in config.things) {
            let thing = config.things[thingId];
            let i = config.things[thingId].class;
            if (i instanceof Array) {
                /*
                 * Natures
                 */
                // Ess
                if (i.includes("EssNature") && !i.includes("EssClusterNature") /* ignore cluster */) {
                    storageThings.push(thingId);
                }
                // Meter
                if (i.includes("MeterNature")) {
                    if ("type" in thing) {
                        if (thing.type == 'grid') {
                            gridMeters.push(thingId);
                        } else if (thing.type === "production") {
                            productionMeters.push(thingId);
                        } else {
                            console.warn("Meter without type: " + thing);
                        }
                    }
                }
                // Charger
                if (i.includes("ChargerNature")) {
                    productionMeters.push(thingId);
                }
            } else {
                /*
                 * Other Things
                 */
                if (i in config.meta) {
                    i = config.meta[i].implements
                    // Bridge
                    if (i.includes("io.openems.api.bridge.Bridge")) {
                        bridges.push(thingId);
                    }
                    // Scheduler
                    if (i.includes("io.openems.api.scheduler.Scheduler")) {
                        scheduler = thingId;
                    }
                    // Controller
                    if (i.includes("io.openems.api.controller.Controller")) {
                        controllers.push(thingId);
                    }
                    // Simulator Devices
                    if (i.includes("io.openems.impl.device.simulator.Simulator")) {
                        simulatorDevices.push(thingId);
                    }
                }
            }
        }

        this.storageThings = storageThings.sort();
        this.gridMeters = gridMeters.sort();
        this.productionMeters = productionMeters.sort();
        this.bridges = bridges.sort();
        this.scheduler = scheduler;
        this.controllers = controllers;
        this.simulatorDevices = simulatorDevices;
    }

    /**
  * Return ChannelAddresses of power channels
  */
    public getPowerChannels(): DefaultTypes.ChannelAddresses {
        let ignoreNatures = { EssClusterNature: true };
        let result: DefaultTypes.ChannelAddresses = {}
        // Set "ignoreNatures"
        for (let thingId of this.storageThings) {
            let i = this.config.things[thingId].class;
            if (i.includes("FeneconCommercialEss")) { // workaround to ignore asymmetric meter for commercial
                ignoreNatures["AsymmetricMeterNature"] = true;
            }
        }
        // Parse all things
        for (let thingId in this.config.things) {
            let i = this.config.things[thingId].class;
            let channels = [];
            // ESS
            if (i.includes("EssNature") && !i.includes("EssClusterNature") /* ignore cluster */) {
                if (i.includes("AsymmetricEssNature")) {
                    channels.push("ActivePowerL1", "ActivePowerL2", "ActivePowerL3", "ReactivePowerL1", "ReactivePowerL2", "ReactivePowerL3");
                } else if (i.includes("SymmetricEssNature")) {
                    channels.push("ActivePower", "ReactivePower");
                }
            }
            // Meter
            if (i.includes("MeterNature")) {
                if (i.includes("AsymmetricMeterNature") && !ignoreNatures["AsymmetricMeterNature"]) {
                    channels.push("ActivePowerL1", "ActivePowerL2", "ActivePowerL3", "ReactivePowerL1", "ReactivePowerL2", "ReactivePowerL3");
                } else if (i.includes("SymmetricMeterNature")) {
                    channels.push("ActivePower", "ReactivePower");
                }
            }
            // Charger
            if (i.includes("ChargerNature")) {
                channels.push("ActualPower");
            }
            // store result
            if (channels.length > 0) {
                result[thingId] = channels;
            }
        }
        return result;
    }

    /**
     * Returns ChannelAddresses of ESS Soc channels
     */
    public getEssSocChannels(): DefaultTypes.ChannelAddresses {
        let result: DefaultTypes.ChannelAddresses = {}
        for (let thingId of this.storageThings) {
            let channels = [];
            // ESS
            channels.push("Soc");
            // store result
            if (channels.length > 0) {
                result[thingId] = channels;
            }
        }
        return result;
    }

    /**
     * Return ChannelAddresses of power and soc channels
     */
    public getImportantChannels(): DefaultTypes.ChannelAddresses {
        let channels: DefaultTypes.ChannelAddresses = this.getPowerChannels();
        let essChannels = this.getEssSocChannels();
        // join/merge both results
        for (let thing in essChannels) {
            if (thing in channels) {
                channels[thing] = channels[thing].concat(essChannels[thing]);
            } else {
                channels[thing] = essChannels[thing];
            }
        }
        return channels;
    }

}