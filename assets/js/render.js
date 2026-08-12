// Renders listing grids from the JSON content model so new projects/services
// can be added by editing data/*.json only -- no page markup changes needed.
(function(){
  function fetchJSON(path){ return fetch(path).then(function(r){ return r.json(); }); }

  // /images/projects/work-N.jpg -> /images/optimized/projects/work-N (webp+jpg, no size suffix)
  function optimizedProjectImg(coverPath){
    var m = coverPath.match(/work-(\d+)\.jpg$/);
    if(!m) return null;
    return { webp: '/images/optimized/projects/work-'+m[1]+'.webp', jpg: '/images/optimized/projects/work-'+m[1]+'.jpg' };
  }

  var projectsGrid = document.querySelector('[data-projects-grid]');
  if(projectsGrid){
    fetchJSON('/data/projects.json').then(function(items){
      var limit = projectsGrid.getAttribute('data-limit');
      if(limit){ items = items.slice(0, parseInt(limit,10)); }
      projectsGrid.innerHTML = items.map(function(p){
        var opt = optimizedProjectImg(p.cover_image) || { webp: p.cover_image, jpg: p.cover_image };
        return '' +
        '<a class="card-project reveal" href="'+p.path+'">' +
          '<picture>' +
            '<source srcset="'+opt.webp+'" type="image/webp">' +
            '<img src="'+opt.jpg+'" width="633" height="475" alt="'+p.title+' — VideoSonic event production, Philippines" loading="lazy">' +
          '</picture>' +
          '<div class="card-project__overlay">' +
            '<span class="card-project__cat">'+p.category+'</span>' +
            '<div class="card-project__title">'+p.title+'</div>' +
          '</div>' +
        '</a>';
      }).join('');
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    });
  }

  var servicesGrid = document.querySelector('[data-services-grid]');
  if(servicesGrid){
    fetchJSON('/data/services.json').then(function(items){
      servicesGrid.innerHTML = items.map(function(s){
        // Cards with an extraLink can't be a single <a> (would need a
        // nested anchor for the extra link), so render those as a <div>
        // with the title linked, plus a small secondary link below.
        if(s.extraLink){
          return '' +
          '<div class="card reveal'+(s.is_primary ? ' card--primary' : '')+'">' +
            '<img class="card__icon" src="'+s.icon+'" width="40" height="40" alt="" aria-hidden="true" loading="lazy">' +
            '<h3><a href="'+s.path+'">'+s.name+'</a>'+(s.is_primary ? ' <span class="tag">Primary</span>' : '')+'</h3>' +
            '<p>'+s.short_desc+'</p>' +
            '<div class="tag-row"><a class="tag" href="'+s.extraLink.href+'">'+s.extraLink.label+' →</a></div>' +
          '</div>';
        }
        return '' +
        '<a class="card reveal'+(s.is_primary ? ' card--primary' : '')+'" href="'+s.path+'">' +
          '<img class="card__icon" src="'+s.icon+'" width="40" height="40" alt="" aria-hidden="true" loading="lazy">' +
          '<h3>'+s.name+(s.is_primary ? ' <span class="tag">Primary</span>' : '')+'</h3>' +
          '<p>'+s.short_desc+'</p>' +
        '</a>';
      }).join('');
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    });
  }

  var capRow = document.querySelector('[data-capabilities]');
  if(capRow){
    fetchJSON('/data/capabilities.json').then(function(items){
      capRow.innerHTML = items.map(function(c){
        return '' +
        '<div class="cap-tile reveal">' +
          '<h4>'+c.label+(c.value ? ' — '+c.value : '')+'</h4>' +
          '<p>'+c.description+'</p>' +
        '</div>';
      }).join('');
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    });
  }
})();
