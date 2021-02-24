use std::collections::HashMap;

use crate::{graph_description::*, node_property::Property};
use node_property::Property::{
    DecrementOnlyIntProp as ProtoDecrementOnlyIntProp,
    DecrementOnlyUintProp as ProtoDecrementOnlyUintProp, ImmutableIntProp as ProtoImmutableIntProp,
    ImmutableStrProp as ProtoImmutableStrProp, ImmutableUintProp as ProtoImmutableUintProp,
    IncrementOnlyIntProp as ProtoIncrementOnlyIntProp,
    IncrementOnlyUintProp as ProtoIncrementOnlyUintProp,
};

pub struct Escaped(String);

impl std::ops::Deref for Escaped {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_str()
    }
}

impl std::fmt::Display for Escaped {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}


fn escape_quote(s: &str) -> Escaped {
    // otherwise we need to double quote it

    let mut output = String::with_capacity(s.len());
    output.push('"');

    for c in s.chars() {
        if c == '"' {
            output += "\\\"";
        } else if c == '\\' {
            output += "\\\\";
        } else {
            output.push(c);
        }
    }

    output.push('"');
    Escaped(output)
}

fn escape_prop(node_property: &NodeProperty) -> Escaped {
    match &node_property.property {
        Some(ProtoIncrementOnlyIntProp(i)) => Escaped(i.to_string()),
        Some(ProtoDecrementOnlyIntProp(i)) => Escaped(i.to_string()),
        Some(ProtoImmutableIntProp(i)) => Escaped(i.to_string()),
        Some(ProtoIncrementOnlyUintProp(i)) => Escaped(i.to_string()),
        Some(ProtoDecrementOnlyUintProp(i)) => Escaped(i.to_string()),
        Some(ProtoImmutableUintProp(i)) => Escaped(i.to_string()),
        Some(ProtoImmutableStrProp(s)) => escape_quote(s),
        None => panic!("todo")
    }
}

pub(crate) fn build_upserts(
    query_param: u128,
    node_key: &str,
    node_type: &str,
    properties: &HashMap<String, NodeProperty>,
) -> (String, Vec<dgraph_tonic::Mutation>) {
    let node_key = escape_quote(node_key);

    let mut inner_queries = String::with_capacity(properties.len() * 32);
    let mut mutations = Vec::with_capacity(properties.len());

    let (creation_var_name, creation_query, creation_quads) = node_creation_quads(query_param, &node_key, node_type);

    mutations.extend_from_slice(&creation_quads[..]);
    inner_queries.push_str(&creation_query);
    inner_queries.push('\n');
    for (prop_name, prop) in properties.iter() {
        if &prop_name == &"node_key" {continue}

        let prop_value = escape_prop(prop);
        let (next_query, muts) = gen_node_property_upsert_quads(
            query_param,
            &creation_var_name,
            &node_key,
            &node_type,
            &prop_name,
            &prop_value,
        );
        inner_queries.push_str(&next_query);
        inner_queries.push('\n');
        mutations.extend_from_slice(&muts[..]);
    }

    (inner_queries, mutations)
}

pub(crate) fn node_creation_quads(
    query_param: u128,
    node_key: &Escaped,
    node_type: &str,
) -> (String, String, [dgraph_tonic::Mutation; 2]) {
    let creation_var_name = format!("node_exists_{}", query_param);
    let mut mu_0 = dgraph_tonic::Mutation::new();
    let escaped_node_key = node_key;
    let inner_query = format!(
        r#"
            q_{creation_var_name}(func: eq(node_key, {node_key}), first: 1) @cascade
            {{
                {creation_var_name} as uid,
                node_key,
            }}
    "#,
        creation_var_name=creation_var_name,
        node_key=escaped_node_key,
    );

    // If the node exists, set the predicate. Currently 'last write wins'.
    let mut mu_0_n_quads = format!(
        r#"uid({creation_var_name}) <node_key> {f} ."#,
        creation_var_name = creation_var_name,
        f = escaped_node_key,
    );

    mu_0.set_set_nquads(mu_0_n_quads);
    mu_0.set_cond(format!("@if(eq(len({creation_var_name}), 1))", creation_var_name=creation_var_name));

    let mut mu_1 = dgraph_tonic::Mutation::new();

    // condition if the node does not exist
    let mut mu_1_n_quads = format!(
        concat!(
        r#"_:node_{query_param} <node_key> {node_key} ."#,
        "\n",
        r#"_:node_{query_param} <dgraph.type> "{node_type}" ."#,
        ),
        node_key = escaped_node_key,
        node_type = node_type,
        query_param = query_param,
    );

    mu_1.set_set_nquads(mu_1_n_quads);
    mu_1.set_cond(format!("@if(eq(len({creation_var_name}), 0))", creation_var_name=creation_var_name));

    (creation_var_name, inner_query, [mu_0, mu_1])

}

pub(crate) fn gen_node_property_upsert_quads(
    query_param: u128,
    creation_var_name: &str,
    node_key: &Escaped,
    node_type: &str,
    prop_name: &str,
    prop_value: &Escaped,
) -> (String, [dgraph_tonic::Mutation; 2]) {
    let mut node_query_name = format!("pred_query_{}_{}", prop_name, query_param);
    let mut mu_0 = dgraph_tonic::Mutation::new();

    let mut inner_query = format!(
        r#"
            {node_query_name} as var(func: uid({creation_var_name}), first: 1)
    "#,
        node_query_name=node_query_name,
        creation_var_name=creation_var_name,
    );

    // If the node exists, set the predicate. Currently 'last write wins'.
    let mut mu_0_n_quads = format!(
        r#"uid({node_query_name}) <{prop_name}> {prop_value} ."#,
        node_query_name=node_query_name,
        prop_name = prop_name,
        prop_value = prop_value,
    );

    mu_0.set_set_nquads(mu_0_n_quads);
    mu_0.set_cond(format!("@if(eq(len({node_query_name}), 1))", node_query_name=node_query_name));

    let mut mu_1 = dgraph_tonic::Mutation::new();

    // condition if the node does not exist
    let mut mu_1_n_quads = format!(
        concat!(
            r#"_:node_{node_query_name} <node_key> {node_key} ."#,
            "\n",
            r#"_:node_{node_query_name} <{prop_name}> {prop_value} ."#,
            "\n",
            r#"_:node_{node_query_name} <dgraph.type> "{node_type}" ."#,
        ),
        node_query_name=node_query_name,
        node_key = node_key,
        node_type = node_type,
        prop_name = prop_name,
        prop_value = prop_value,
    );

    mu_1.set_set_nquads(mu_1_n_quads);
    mu_1.set_cond(format!("@if(eq(len({node_query_name}), 0))", node_query_name=node_query_name));

    (inner_query, [mu_0, mu_1])
}
