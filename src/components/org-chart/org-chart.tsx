import type { ReactNode } from "react";
import "./org-chart.css";

export type OrgTreeNode<T> = T & { children: OrgTreeNode<T>[] };

export function buildOrgTree<
  T extends { id: string; parentId: string | null; sortOrder: number },
>(items: T[]): OrgTreeNode<T>[] {
  const nodes = new Map<string, OrgTreeNode<T>>(
    items.map((item) => [item.id, { ...item, children: [] }]),
  );
  const roots: OrgTreeNode<T>[] = [];

  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortRec(list: OrgTreeNode<T>[]) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of list) sortRec(node.children);
  }
  sortRec(roots);

  return roots;
}

export function OrgChart<T extends { id: string }>({
  nodes,
  renderNode,
}: {
  nodes: OrgTreeNode<T>[];
  renderNode: (node: OrgTreeNode<T>) => ReactNode;
}) {
  return (
    <div className="org-tree">
      <ul>
        {nodes.map((node) => (
          <OrgChartBranch key={node.id} node={node} renderNode={renderNode} />
        ))}
      </ul>
    </div>
  );
}

function OrgChartBranch<T extends { id: string }>({
  node,
  renderNode,
}: {
  node: OrgTreeNode<T>;
  renderNode: (node: OrgTreeNode<T>) => ReactNode;
}) {
  return (
    <li>
      <div className="org-tree-box">{renderNode(node)}</div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgChartBranch
              key={child.id}
              node={child}
              renderNode={renderNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
