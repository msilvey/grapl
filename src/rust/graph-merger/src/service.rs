<<<<<<< HEAD
=======

use crate::upserter;
use crate::upsert_util;
use crate::reverse_resolver;

>>>>>>> internal-286-lens-header-dup
use std::{collections::HashMap,
          fmt::Debug,
          io::Stdout,
          sync::{Arc,
                 Mutex},
          time::{Duration,
                 SystemTime,
                 UNIX_EPOCH}};
<<<<<<< HEAD
=======
use crate::reverse_resolver::{get_r_edges_from_dynamodb, ReverseEdgeResolver};
>>>>>>> internal-286-lens-header-dup

use async_trait::async_trait;
use dgraph_tonic::{Client as DgraphClient,
                   Mutate,
                   Query};
use failure::{bail,
              Error};
use grapl_config::{env_helpers::{s3_event_emitters_from_env,
                                 FromEnv},
                   event_caches};
use grapl_graph_descriptions::graph_description::{Edge,
<<<<<<< HEAD
                                                  EdgeList,
                                                  IdentifiedGraph,
                                                  IdentifiedNode,
                                                  MergedGraph,
                                                  MergedNode};
=======
                                                  IdentifiedGraph,
                                                  IdentifiedNode,
                                                  MergedGraph,
                                                  MergedNode,
                                                  EdgeList};
>>>>>>> internal-286-lens-header-dup
use grapl_observe::{dgraph_reporter::DgraphMetricReporter,
                    metric_reporter::{tag,
                                      MetricReporter}};
use grapl_service::{decoder::ZstdProtoDecoder,
                    serialization::MergedGraphSerializer};
<<<<<<< HEAD
use grapl_utils::{future_ext::GraplFutureExt,
                  rusoto_ext::dynamodb::GraplDynamoDbClientExt};
use lazy_static::lazy_static;
=======

use grapl_utils::{future_ext::GraplFutureExt,
                  rusoto_ext::dynamodb::GraplDynamoDbClientExt};
use lazy_static::lazy_static;
use tracing::{error,
          info,
          warn};
>>>>>>> internal-286-lens-header-dup
use rusoto_dynamodb::{AttributeValue,
                      BatchGetItemInput,
                      DynamoDb,
                      DynamoDbClient,
                      GetItemInput,
                      KeysAndAttributes};
use rusoto_s3::S3Client;
use rusoto_sqs::SqsClient;
use serde::{Deserialize,
            Serialize};
use serde_json::Value;
use sqs_executor::{cache::{Cache,
                           CacheResponse,
                           Cacheable},
                   errors::{CheckedError,
                            Recoverable},
                   event_handler::{CompletedEvents,
                                   EventHandler},
                   event_retriever::S3PayloadRetriever,
                   make_ten,
                   s3_event_emitter::S3ToSqsEventNotifier};
<<<<<<< HEAD
use tracing::{error,
              info,
              warn};

use crate::{reverse_resolver,
            reverse_resolver::{get_r_edges_from_dynamodb,
                               ReverseEdgeResolver},
            upsert_util,
            upserter};

#[derive(Clone)]
pub struct GraphMerger<CacheT>
where
    CacheT: Cache + Clone + Send + Sync + 'static,
=======

#[derive(Clone)]
pub struct GraphMerger<CacheT>
    where
        CacheT: Cache + Clone + Send + Sync + 'static,
>>>>>>> internal-286-lens-header-dup
{
    mg_client: Arc<DgraphClient>,
    reverse_edge_resolver: ReverseEdgeResolver,
    metric_reporter: MetricReporter<Stdout>,
    cache: CacheT,
}

impl<CacheT> GraphMerger<CacheT>
<<<<<<< HEAD
where
    CacheT: Cache + Clone + Send + Sync + 'static,
=======
    where
        CacheT: Cache + Clone + Send + Sync + 'static,
>>>>>>> internal-286-lens-header-dup
{
    pub fn new(
        mg_alphas: Vec<String>,
        reverse_edge_resolver: ReverseEdgeResolver,
        metric_reporter: MetricReporter<Stdout>,
        cache: CacheT,
    ) -> Self {
        let mg_client = DgraphClient::new(mg_alphas).expect("Failed to create dgraph client.");

        Self {
            mg_client: Arc::new(mg_client),
            reverse_edge_resolver,
            metric_reporter,
            cache,
        }
    }
}

<<<<<<< HEAD
=======

>>>>>>> internal-286-lens-header-dup
#[derive(thiserror::Error, Debug)]
pub enum GraphMergerError {
    #[error("UnexpectedError")]
    Unexpected(String),
}

impl CheckedError for GraphMergerError {
    fn error_type(&self) -> Recoverable {
        Recoverable::Transient
    }
}

#[async_trait]
impl<CacheT> EventHandler for GraphMerger<CacheT>
<<<<<<< HEAD
where
    CacheT: Cache + Clone + Send + Sync + 'static,
=======
    where
        CacheT: Cache + Clone + Send + Sync + 'static,
>>>>>>> internal-286-lens-header-dup
{
    type InputEvent = IdentifiedGraph;
    type OutputEvent = MergedGraph;
    type Error = GraphMergerError;

    async fn handle_event(
        &mut self,
        subgraph: Self::InputEvent,
        _completed: &mut CompletedEvents,
    ) -> Result<Self::OutputEvent, Result<(Self::OutputEvent, Self::Error), Self::Error>> {
        if subgraph.is_empty() {
            warn!("Attempted to merge empty subgraph. Short circuiting.");
            return Ok(MergedGraph::default());
        }

        info!(
            message=
            "handling new subgraph",
            nodes=?subgraph.nodes.len(),
            edges=?subgraph.edges.len(),
        );

        let uncached_nodes = subgraph.nodes.into_iter().map(|(_, n)| n);
<<<<<<< HEAD
        let mut uncached_edges: Vec<_> = subgraph
            .edges
            .into_iter()
            .flat_map(|e| e.1.into_vec())
            .collect();
        let reverse = self
            .reverse_edge_resolver
            .resolve_reverse_edges(uncached_edges.clone())
            .await
=======
        let mut uncached_edges: Vec<_> = subgraph.edges.into_iter().flat_map(|e| e.1.into_vec()).collect();
        let reverse = self.reverse_edge_resolver.resolve_reverse_edges(uncached_edges.clone()).await
>>>>>>> internal-286-lens-header-dup
            .map_err(Err)?;

        uncached_edges.extend_from_slice(&reverse[..]);

        let mut merged_graph = MergedGraph::new();
        let mut uncached_subgraph = IdentifiedGraph::new();

        for node in uncached_nodes {
            uncached_subgraph.add_node(node);
        }

        for edge in uncached_edges {
<<<<<<< HEAD
            uncached_subgraph.add_edge(edge.edge_name, edge.from_node_key, edge.to_node_key);
        }

        upserter::GraphMergeHelper {}
            .upsert_into(
                self.mg_client.clone(),
                &uncached_subgraph,
                &mut merged_graph,
            )
=======
            uncached_subgraph.add_edge(
                edge.edge_name,
                edge.from_node_key,
                edge.to_node_key,
            );
        }

        upserter::GraphMergeHelper{}
            .upsert_into(self.mg_client.clone(), &uncached_subgraph, &mut merged_graph)
>>>>>>> internal-286-lens-header-dup
            .await;

        Ok(merged_graph)
    }
}

<<<<<<< HEAD
=======

>>>>>>> internal-286-lens-header-dup
pub fn time_based_key_fn(_event: &[u8]) -> String {
    let cur_ms = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(n) => n.as_millis(),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    };

    let cur_day = cur_ms - (cur_ms % 86400);

    format!("{}/{}-{}", cur_day, cur_ms, uuid::Uuid::new_v4())
}
