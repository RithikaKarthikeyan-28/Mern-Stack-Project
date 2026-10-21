import React from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Video, Link2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const LessonContentRenderer = ({ lesson, currentModule = null }) => {
  if (!lesson) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        Select a lesson from the curriculum to begin learning.
      </div>
    );
  }

  const { title, contentType, content, resourceUrl } = lesson;

  // Video embed helper
  const renderVideoPlayer = (url) => {
    if (!url) return null;

    // Check for YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md my-4">
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Direct video stream / MP4 / WebM
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md my-4">
          <video controls className="w-full h-full">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Generic external video link fallback
    return (
      <div className="p-4 my-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">External Video Stream</h4>
            <p className="text-xs text-slate-500 truncate max-w-md">{url}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
        >
          Open Video
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="lesson-content-renderer">
      {/* Lesson Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          {currentModule && (
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              {currentModule.title}
            </span>
          )}
          <Badge variant="default" size="sm" className="capitalize">
            {contentType}
          </Badge>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A2A] tracking-tight">
          {title}
        </h2>
      </div>

      {/* Video Content Type */}
      {contentType === 'video' && resourceUrl && (
        <div className="space-y-4">
          {renderVideoPlayer(resourceUrl)}
        </div>
      )}

      {/* Link / External Resource Content Type */}
      {contentType === 'link' && resourceUrl && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">External Learning Resource</h4>
              <p className="text-xs text-slate-500 mt-0.5 break-all line-clamp-1">{resourceUrl}</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(resourceUrl, '_blank', 'noopener,noreferrer')}
            rightIcon={<ExternalLink className="w-4 h-4" />}
            className="shrink-0"
          >
            Visit Resource
          </Button>
        </div>
      )}

      {/* Lesson Body Content (Markdown/Text formatting) */}
      <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        {content}
      </div>
    </div>
  );
};

LessonContentRenderer.propTypes = {
  lesson: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    contentType: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    resourceUrl: PropTypes.string,
  }),
  currentModule: PropTypes.shape({
    title: PropTypes.string,
  }),
};

export default LessonContentRenderer;
