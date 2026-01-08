import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiBook, FiVideo, FiHeadphones, FiTool } from 'react-icons/fi';
import './Resources.css';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await api.get('/resources', { params });
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FiVideo />;
      case 'podcast':
        return <FiHeadphones />;
      case 'toolkit':
        return <FiTool />;
      default:
        return <FiBook />;
    }
  };

  if (loading) {
    return <div className="loading">Loading resources...</div>;
  }

  return (
    <div className="resources-page">
      <div className="container">
        <h1>Resource Library</h1>
        <p className="subtitle">Access articles, videos, podcasts, and self-help toolkits</p>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Resources
          </button>
          <button
            className={`filter-tab ${filter === 'article' ? 'active' : ''}`}
            onClick={() => setFilter('article')}
          >
            Articles
          </button>
          <button
            className={`filter-tab ${filter === 'video' ? 'active' : ''}`}
            onClick={() => setFilter('video')}
          >
            Videos
          </button>
          <button
            className={`filter-tab ${filter === 'podcast' ? 'active' : ''}`}
            onClick={() => setFilter('podcast')}
          >
            Podcasts
          </button>
          <button
            className={`filter-tab ${filter === 'toolkit' ? 'active' : ''}`}
            onClick={() => setFilter('toolkit')}
          >
            Toolkits
          </button>
        </div>

        {resources.length > 0 ? (
          <div className="resources-grid">
            {resources.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div className="resource-icon">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="resource-content">
                  <h3>{resource.title}</h3>
                  {resource.description && <p>{resource.description}</p>}
                  {resource.category && (
                    <span className="resource-category">{resource.category}</span>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      View Resource
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiBook size={64} />
            <h3>No resources found</h3>
            <p>Resources will appear here once they are added by counsellors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
