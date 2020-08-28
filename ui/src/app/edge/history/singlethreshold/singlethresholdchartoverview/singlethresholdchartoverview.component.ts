import { Component } from '@angular/core';
import { Service, Utils, EdgeConfig, Edge } from '../../../../shared/shared';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: SinglethresholdChartOverviewComponent.SELECTOR,
    templateUrl: './singlethresholdchartoverview.component.html'
})
export class SinglethresholdChartOverviewComponent {

    private static readonly SELECTOR = "channelthreshold-chart-overview";

    public edge: Edge = null;

    public component: EdgeConfig.Component;
    public inputChannel: string;

    public channelthresholdComponents: string[] = [];

    // referene to the Utils method to access via html
    public isLastElement = Utils.isLastElement;

    constructor(
        public service: Service,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.service.setCurrentComponent('', this.route).then(edge => {
            this.service.getConfig().then(config => {
                this.edge = edge;
                this.inputChannel = config.getComponentProperties(this.component.id)['inputChannelAddress'];
                for (let componentId of config.getComponentIdsByFactory("Controller.IO.ChannelSingleThreshold")) {
                    this.channelthresholdComponents.push(componentId)
                }
            })
        });
    }
}