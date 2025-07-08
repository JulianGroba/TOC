import * as WEBIFC from "web-ifc"
import * as OBC from "@thatopen/components"
import * as FRAGS from "@thatopen/fragments"
import { getModelUnit } from "./src/get-model-unit"

type QtoResult = {
    [setName: string]: {
        [name: string]: {
            value: number;
            unit: string;
        };
    };
}
export class SimpleQto extends OBC.Component implements OBC.Disposable {
    static uuid = "e7416aa4-3afe-487c-b349-1e1964b29265"
    enabled = true
    onDisposed: OBC.Event<any>
    private _qtoResult: QtoResult = {}

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(SimpleQto.uuid, this)

    }
    resetQuantities() {
        this._qtoResult = {}
    }
        async sumQuantities(fragmentIdMap: FRAGS.FragmentIdMap) { // FASTER
            console.time("QTO V2")
            const fragmentManager = this.components.get(OBC.FragmentsManager)
            const modelIdMap = fragmentManager.getModelIdMap(fragmentIdMap)

            this._qtoResult = {}
            const processedIDs = new Set();
            for (const modelId in modelIdMap) {
                const model = fragmentManager.groups.get(modelId)
                if (!model) continue
                if (!model.hasProperties) { return }
                for (const fragmentID in fragmentIdMap) {
                    const expressIDs = fragmentIdMap[fragmentID]
                    const indexer = this.components.get(OBC.IfcRelationsIndexer)
                    for (const id of expressIDs) {
                    const sets = indexer.getEntityRelations(model, id, "IsDefinedBy") || [];
                    if (!sets || sets.length === 0) {
                        console.warn(`No se encontraron conjuntos para ID ${id} en el modelo ${modelId}.`);
                        continue;
                    }
                    
                    for (const expressID of sets) {
                        if (processedIDs.has(expressID)) {
                            continue
                        };
                        processedIDs.add(expressID)
                        const set = await model.getProperties(expressID)
                        const { name: setName } = await OBC.IfcPropertiesUtils.getEntityName(model, expressID)
                        if (set?.type !== WEBIFC.IFCELEMENTQUANTITY || !setName) {
                            continue}
                        if (!(setName in this._qtoResult)) { this._qtoResult[setName] = {} }
                        for (const qtoHandle of set.Quantities){
                            const propAtt = await model.getProperties(qtoHandle.value)
                            if(!propAtt) {
                                continue}
                            const valueKey = Object.keys(propAtt).find((atr)=> atr.toLowerCase().includes("value"))
                            if(!(valueKey && propAtt[valueKey])) {
                                continue}
                            let value = propAtt[valueKey].value
                            let {name} = propAtt[valueKey]
                            const units: Record<string, any> = (await getModelUnit(model, name)) ?? {};
                            let symbol = units.symbol ?? ""
                            const ifcLabelValue  = propAtt.Name.value
                            if (typeof value === "string") {
                                value = parseFloat(value.replace(/[^\d.-]/g, ""));
                            }

                            if (typeof value === "number" && !isNaN(value)) {
                                const digits = typeof units.digits === "number" ? units.digits : 2; 
                                value = Number(value.toFixed(digits)); 
                            } else {
                                value = 0;
                            }
                            console.log(`Final Value: ${ifcLabelValue} ${value} ${symbol}`);

                            if (!(ifcLabelValue in this._qtoResult[setName])) { 
                                this._qtoResult[setName][ifcLabelValue] = {value: 0, unit: symbol} }
                            
                            if (!isNaN(value)){
                                this._qtoResult[setName][ifcLabelValue].value += value
                            } else {
                                console.warn(`Valor no numérico para ${name}: ${propAtt[valueKey].value}`);
                            }
                        }
                    }
                    }
                }
                }
            }


    async dispose() {
        this.enabled = false
        this.resetQuantities()
        this.onDisposed.trigger()
    }
}
