
import * as React from 'react';
import { useState } from 'react';
import * as ai from '../services/geminiService';
import { surrealService } from '../services/surrealService';
import { GraphNode, NodeSchema, EdgeSchema, AxisPreference } from '../types';

export const useAIIntegration = (
    data: { nodeSchema: NodeSchema[], edgeSchema: EdgeSchema[] },
    fetchGraph: (project: string) => Promise<void>,
    activeProject: string,
    setSelectedNode: (node: GraphNode | null) => void
) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const calculatePosition = (parent: GraphNode, schema: NodeSchema) => {
        const offset = 150 + Math.random() * 50;
        const getCoord = (axis: AxisPreference, current: number) => {
            if (axis === 'positive') return current + offset;
            if (axis === 'negative') return current - offset;
            if (axis === 'neutral') return current + (Math.random() - 0.5) * 40;
            return current + (Math.random() - 0.5) * offset * 3;
        };
        return {
            x: getCoord(schema.flow_x, parent.x || 0),
            y: getCoord(schema.flow_y, parent.y || 0),
            z: getCoord(schema.flow_z, parent.z || 0)
        };
    };

    const handleCreateNode = async (type: string, parent: GraphNode, edge: string) => {
        const title = prompt(`Enter title for new ${type}:`);
        if (!title) return;

        setIsGenerating(true);
        try {
            const schema = data.nodeSchema.find(s => s.type === type)!;
            const edgeDef = data.edgeSchema.find(e => e.type === edge);
            const nature = edgeDef?.nature || 'child';

            const pos = calculatePosition(parent, schema);

            // Generate content via AI
            const pkg = await ai.generateNodePackage(title, parent.title);

            const newNode: GraphNode = {
                // Generate a more robust ID if possible, but basic unique suffix works for now
                id: `node:${title.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 4)}`,
                title,
                summary: pkg.summary,
                content: pkg.content,
                type: type as any,
                val: schema.nature === 'child' ? 18 : 12,
                color: schema.color,
                flow_x: schema.flow_x, // Explicitly pass flow logic for 3D layout if needed later
                flow_y: schema.flow_y,
                flow_z: schema.flow_z,
                ...pos
            };

            await surrealService.createNode(newNode);
            await surrealService.relate(newNode.id, parent.id, edge, nature);
            await fetchGraph(activeProject);
            setSelectedNode(newNode);
        } catch (e: any) {
            alert("Action failed: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        handleCreateNode
    };
};
